import asyncio
import json
from abc import ABC, abstractmethod
from typing import Any

from app.core.config import settings


class BaseLLMProvider(ABC):
    name: str

    @abstractmethod
    async def summarize(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def categorize(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def score_impact(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def classify_relevance(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError


class TransformersGemmaProvider(BaseLLMProvider):
    name = "gemma"

    def __init__(self) -> None:
        self._processor = None
        self._model = None

    def _ensure_model_loaded(self) -> None:
        if self._processor is not None and self._model is not None:
            return

        try:
            from transformers import AutoModelForCausalLM, AutoProcessor
        except ImportError as exc:
            raise RuntimeError(
                "transformers is not installed. Install backend dependencies before using Gemma."
            ) from exc

        token = settings.huggingface_api_token or None
        self._processor = AutoProcessor.from_pretrained(settings.gemma_model_id, token=token)
        self._model = AutoModelForCausalLM.from_pretrained(
            settings.gemma_model_id,
            token=token,
            torch_dtype="auto",
            device_map=settings.gemma_device_map,
        )

    def _run_prompt(self, prompt: str) -> str:
        self._ensure_model_loaded()
        assert self._processor is not None
        assert self._model is not None

        inputs = self._processor(text=prompt, return_tensors="pt")
        model_device = next(self._model.parameters()).device
        inputs = {name: tensor.to(model_device) for name, tensor in inputs.items()}

        generated = self._model.generate(
            **inputs,
            max_new_tokens=settings.gemma_max_new_tokens,
            do_sample=True,
            temperature=settings.gemma_temperature,
            top_p=settings.gemma_top_p,
        )
        input_length = inputs["input_ids"].shape[-1]
        generated_tokens = generated[:, input_length:]
        return self._processor.batch_decode(generated_tokens, skip_special_tokens=True)[0].strip()

    async def _complete_json(self, prompt: str) -> dict[str, Any]:
        if settings.huggingface_api_token:
            try:
                from huggingface_hub import InferenceClient

                client = InferenceClient(api_key=settings.huggingface_api_token)
                raw = await asyncio.to_thread(
                    client.text_generation,
                    prompt,
                    model=settings.gemma_model_id,
                    max_new_tokens=settings.gemma_max_new_tokens,
                    temperature=settings.gemma_temperature,
                    top_p=settings.gemma_top_p,
                )
            except Exception:
                raw = await asyncio.to_thread(self._run_prompt, prompt)
        else:
            raw = await asyncio.to_thread(self._run_prompt, prompt)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(raw[start : end + 1])
            raise ValueError(f"Gemma returned non-JSON output: {raw}")

    async def summarize(self, payload: dict[str, Any]) -> dict[str, Any]:
        prompt = f"""
You are summarizing high-signal engineering news for senior software engineers.

Return strict JSON with keys:
- what_happened
- why_it_matters
- who_is_affected
- immediate_risks
- long_term_implications

Rules:
- concise
- technical
- no marketing language
- no markdown

Article:
title: {payload.get("title", "")}
excerpt: {payload.get("excerpt", "")}
content: {payload.get("content", "")}
source: {payload.get("source", "")}
"""
        return await self._complete_json(prompt)

    async def categorize(self, payload: dict[str, Any]) -> dict[str, Any]:
        prompt = f"""
You classify engineering intelligence news.

Return strict JSON with:
- primary_category: one of ["AI","Security","Infra","OSS","Cloud","Tooling","Research","Regulation","Supply Chain"]
- secondary_tags: array of short strings
- affected_roles: array of short strings
- confidence: number from 0 to 1

Prefer ecosystem impact over corporate branding.

Article:
title: {payload.get("title", "")}
excerpt: {payload.get("excerpt", "")}
content: {payload.get("content", "")}
"""
        return await self._complete_json(prompt)

    async def score_impact(self, payload: dict[str, Any]) -> dict[str, Any]:
        prompt = f"""
You score engineering impact for software engineers.

Return strict JSON with:
- impact_score: number from 0 to 10
- urgency: one of ["low","medium","high","critical"]
- affected_roles: array of short strings
- why_it_matters: one concise technical sentence

Bias toward:
- security incidents
- supply-chain risk
- cloud outages
- major AI model releases
- breaking ecosystem changes

Article:
title: {payload.get("title", "")}
excerpt: {payload.get("excerpt", "")}
content: {payload.get("content", "")}
"""
        return await self._complete_json(prompt)

    async def classify_relevance(self, payload: dict[str, Any]) -> dict[str, Any]:
        prompt = f"""
You are an engineering intelligence relevance classifier.

Determine whether this story is genuinely important for software engineers, AI engineers, DevOps engineers, security engineers, or infrastructure engineers.

Only keep stories involving:
- production systems
- cloud infrastructure
- developer ecosystems
- security incidents
- major framework/runtime changes
- AI capability breakthroughs
- supply-chain attacks
- OSS ecosystem impact
- tooling/platform changes

Reject:
- personal posts
- opinion essays
- philosophical discussions
- beginner questions
- showcase projects
- random demos
- low-impact OSS projects
- generic AI hype

Return strict JSON with:
- relevance_score: number from 0 to 10
- keep: boolean
- short_reason: short sentence
- affected_engineer_types: array of short strings
- category_name: one of ["AI","Security","Infra","OSS","Cloud","Tooling","Research","Supply Chain"]
- ecosystem_tags: array of short uppercase technical tags such as ["NODE","REACT","AWS","CUDA","PYPI","KUBERNETES","CI/CD"]

Title: {payload.get("title", "")}
Excerpt: {payload.get("excerpt", "")}
Content: {payload.get("content", "")}
Source: {payload.get("source", "")}
Tags: {payload.get("tags", [])}
"""
        return await self._complete_json(prompt)


GemmaProvider = TransformersGemmaProvider
