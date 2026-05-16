# Ingestion And Intelligence Pipeline

## Stage 1: Source ingestion

Sources are modular providers that emit a normalized payload:

- `external_id`
- `source_slug`
- `title`
- `canonical_url`
- `published_at`
- `author`
- `content`
- `excerpt`
- `tags`
- `raw_metadata`

Supported source classes:

- RSS feeds
- APIs
- GitHub releases, advisories, discussions
- Reddit engineering subreddits
- Hacker News
- vendor engineering blogs
- AI company announcements
- security advisories

## Stage 2: Deduplication

Deduplication combines:

- canonical URL normalization
- host-aware URL stripping
- title string similarity
- semantic embedding similarity
- publish time proximity

Decision output:

```json
{
  "status": "duplicate",
  "canonical_story_id": "story_123",
  "confidence": 0.94,
  "matched_on": ["normalized_url", "embedding_similarity"]
}
```

## Stage 3: Categorization

Primary categories:

- AI
- Security
- Infra
- OSS
- Cloud
- Tooling
- Research
- Regulation
- Supply Chain

Secondary tags capture technologies, vendors, runtimes, languages, and affected ecosystems.

## Stage 4: Impact scoring

Weighted dimensions:

- ecosystem reach
- security severity
- developer impact
- infrastructure relevance
- enterprise relevance
- urgency
- novelty
- AI ecosystem importance
- downstream dependency risk

## Stage 5: AI summarization

Summary format:

1. What happened
2. Why it matters
3. Who is affected
4. Immediate risks
5. Long-term implications

The summary must stay terse, technical, and free of marketing tone.
