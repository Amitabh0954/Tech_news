import asyncio
import re
from abc import ABC, abstractmethod
from datetime import UTC, datetime
from html import unescape
from typing import Any
from urllib.parse import parse_qs, urlparse

import feedparser
import httpx
from slugify import slugify

from app.core.config import settings


_SKIP_IMAGE_HINTS = ("avatar", "gravatar", "spacer", "pixel", "tracking", "1x1", "icon-", "favicon", "badge")


def _extract_first_image_from_html(html: str) -> str | None:
    if not html:
        return None
    for match in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE):
        src = match.group(1)
        lowered = src.lower()
        if any(hint in lowered for hint in _SKIP_IMAGE_HINTS):
            continue
        width_match = re.search(r'width=["\'](\d+)', match.group(0))
        if width_match and int(width_match.group(1)) < 80:
            continue
        return src
    return None


def _strip_html_tags(text: str) -> str:
    """Plain-text excerpt for fields rendered as text, not HTML (e.g. card summaries).
    unescape() alone only decodes entities like &lt;p&gt; -> <p> — it leaves the tags
    themselves in place, which then show up literally in the UI.
    """
    if not text:
        return text
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text)).strip()


def _extract_rss_image(entry: Any, summary: str, full_content: str = "") -> str | None:
    media_content = getattr(entry, "media_content", None) or []
    if media_content and isinstance(media_content, list):
      first = media_content[0]
      if isinstance(first, dict) and first.get("url"):
          return str(first["url"])

    media_thumbnail = getattr(entry, "media_thumbnail", None) or []
    if media_thumbnail and isinstance(media_thumbnail, list):
      first = media_thumbnail[0]
      if isinstance(first, dict) and first.get("url"):
          return str(first["url"])

    enclosures = getattr(entry, "enclosures", None) or []
    for enclosure in enclosures:
        href = getattr(enclosure, "href", None) or (enclosure.get("href") if isinstance(enclosure, dict) else None)
        if href:
            return str(href)

    links = getattr(entry, "links", None) or []
    for link in links:
        href = getattr(link, "href", None) or (link.get("href") if isinstance(link, dict) else None)
        link_type = getattr(link, "type", None) or (link.get("type") if isinstance(link, dict) else None)
        if href and link_type and str(link_type).startswith("image/"):
            return str(href)

    # Many feeds (e.g. Blogger-based blogs like Google Developers Blog) only put the
    # real post image inside the full HTML body, not the short summary — without this,
    # those articles fell through to a generic company-logo/placeholder fallback.
    return _extract_first_image_from_html(summary) or _extract_first_image_from_html(full_content)


_META_TAG_PATTERN = re.compile(r"<meta\b[^>]*>", re.IGNORECASE)
_META_NAME_PATTERN = re.compile(r'(?:property|name)=["\'](og:image|twitter:image)["\']', re.IGNORECASE)
_META_CONTENT_PATTERN = re.compile(r'content=["\']([^"\']+)["\']', re.IGNORECASE)


async def _fetch_og_image(client: httpx.AsyncClient, url: str) -> str | None:
    """Last resort: some feeds (e.g. Blogger-based blogs) carry no image data at all,
    only a link to the live page. Fetch that page and read its og:image so cards use
    the real article image instead of a generic company-logo/placeholder fallback.
    """
    try:
        response = await client.get(url, timeout=6.0)
        if response.status_code >= 400:
            return None
        for tag in _META_TAG_PATTERN.findall(response.text[:200_000]):
            if _META_NAME_PATTERN.search(tag):
                content_match = _META_CONTENT_PATTERN.search(tag)
                if content_match:
                    return content_match.group(1)
        return None
    except Exception:
        return None


def _youtube_thumbnail(entry: Any, link: str) -> str | None:
    video_id = getattr(entry, "yt_videoid", None)
    if not video_id:
        entry_id = getattr(entry, "id", "")
        if "video:" in entry_id:
            video_id = entry_id.rsplit("video:", 1)[-1]
    if not video_id and "youtube.com/watch" in link:
        video_id = parse_qs(urlparse(link).query).get("v", [None])[0]
    if not video_id and "youtu.be/" in link:
        video_id = link.rstrip("/").rsplit("/", 1)[-1]
    if video_id:
        return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
    return None


class BaseProvider(ABC):
    slug: str

    @abstractmethod
    async def fetch_items(self) -> list[dict[str, Any]]:
        raise NotImplementedError


class RSSProvider(BaseProvider):
    slug = "rss"

    def __init__(self, feed_urls: list[str] | None = None) -> None:
        self.feed_urls = feed_urls or settings.rss_feed_urls

    async def _fetch_feed(self, feed_url: str) -> list[dict[str, Any]]:
        try:
            feed = await asyncio.to_thread(feedparser.parse, feed_url)
        except Exception:
            return []

        items: list[dict[str, Any]] = []
        feed_title = getattr(getattr(feed, "feed", None), "title", "") or ""
        for entry in getattr(feed, "entries", [])[: settings.rss_story_limit_per_feed]:
            title = unescape(getattr(entry, "title", "")).strip()
            if not title:
                continue
            link = getattr(entry, "link", "")
            summary = unescape(getattr(entry, "summary", "")).strip()
            full_content = ""
            if getattr(entry, "content", None):
                try:
                    full_content = unescape(entry.content[0].value).strip()
                except Exception:
                    full_content = ""
            published_struct = getattr(entry, "published_parsed", None)
            published_at = datetime(*published_struct[:6], tzinfo=UTC) if published_struct else None
            host = urlparse(link).netloc if link else "rss-feed"
            source_name = feed_title or host
            source_slug = slugify(source_name) or host.replace(".", "-")
            youtube_image = _youtube_thumbnail(entry, link) if "youtube.com" in host else None
            image_url = youtube_image or _extract_rss_image(entry, summary, full_content)
            plain_summary = _strip_html_tags(summary)
            items.append(
                {
                    "external_id": slugify(f"{feed_url}-{title}")[:120],
                    "source_slug": source_slug,
                    "source_name": source_name,
                    "source_type": "youtube" if "youtube.com" in host else "rss",
                    "title": title,
                    "canonical_url": link or feed_url,
                    "published_at": published_at,
                    "author": getattr(entry, "author", None),
                    "content": full_content or summary,
                    "excerpt": plain_summary[:500] or title,
                    "image_url": image_url,
                    "tags": ["rss", host, "youtube" if "youtube.com" in host else "article"],
                    "raw_metadata": {"feed_url": feed_url},
                }
            )

        missing_image = [item for item in items if not item["image_url"] and item["canonical_url"]]
        if missing_image:
            async with httpx.AsyncClient(headers={"User-Agent": "Mozilla/5.0 (compatible; EngIntelBot/1.0)"}) as client:
                fetched = await asyncio.gather(
                    *[_fetch_og_image(client, item["canonical_url"]) for item in missing_image]
                )
            for item, og_image in zip(missing_image, fetched):
                if og_image:
                    item["image_url"] = og_image

        return items

    async def fetch_items(self) -> list[dict[str, Any]]:
        batches = await asyncio.gather(*[self._fetch_feed(feed_url) for feed_url in self.feed_urls])
        items: list[dict[str, Any]] = []
        for batch in batches:
            items.extend(batch)
        return items


class GitHubProvider(BaseProvider):
    slug = "github"

    def __init__(self, queries: list[str] | None = None) -> None:
        self.queries = queries or settings.github_repository_queries

    async def fetch_items(self) -> list[dict[str, Any]]:
        if not settings.github_token:
            return []

        headers = {"Authorization": f"Bearer {settings.github_token}"}
        try:
            async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
                responses = await asyncio.gather(
                    *[
                        client.get(
                            "https://api.github.com/search/repositories",
                            params={
                                "q": query,
                                "sort": "updated",
                                "order": "desc",
                                "per_page": settings.github_repository_limit_per_query,
                            },
                        )
                        for query in self.queries
                    ]
                )
        except Exception:
            return []

        items: list[dict[str, Any]] = []
        for response in responses:
            if response.status_code >= 400:
                continue
            payload = response.json()
            for repo in payload.get("items", []):
                title = repo["full_name"]
                description = repo.get("description") or title
                items.append(
                    {
                        "external_id": str(repo["id"]),
                        "source_slug": self.slug,
                        "source_name": "GitHub",
                        "source_type": "github",
                        "title": title,
                        "canonical_url": repo["html_url"],
                        "published_at": datetime.fromisoformat(repo["updated_at"].replace("Z", "+00:00")),
                        "author": repo.get("owner", {}).get("login"),
                        "content": description,
                        "excerpt": description[:500],
                        "image_url": repo.get("owner", {}).get("avatar_url"),
                        "tags": ["github", repo.get("language") or "unknown", "repository"],
                        "raw_metadata": {
                            "stars": repo.get("stargazers_count"),
                            "watchers": repo.get("watchers_count"),
                            "topics": repo.get("topics", []),
                        },
                    }
                )
        return items


class RedditProvider(BaseProvider):
    slug = "reddit"

    def __init__(self, urls: list[str] | None = None) -> None:
        self.urls = urls or settings.reddit_top_urls

    async def fetch_items(self) -> list[dict[str, Any]]:
        headers = {"User-Agent": settings.reddit_user_agent}
        try:
            async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
                responses = await asyncio.gather(*[client.get(url) for url in self.urls])
        except Exception:
            return []

        items: list[dict[str, Any]] = []
        for response in responses:
            if response.status_code >= 400:
                continue
            payload = response.json()
            posts = payload.get("data", {}).get("children", [])[: settings.reddit_story_limit_per_feed]
            for post_wrapper in posts:
                post = post_wrapper.get("data", {})
                if not post or post.get("stickied"):
                    continue
                subreddit = str(post.get("subreddit", "")).lower()
                published_at = datetime.fromtimestamp(post.get("created_utc", 0), tz=UTC)
                title = post.get("title") or ""
                permalink = post.get("permalink") or ""
                items.append(
                    {
                        "external_id": str(post.get("id")),
                        "source_slug": f"reddit-{subreddit}",
                        "source_name": f"Reddit {subreddit}",
                        "source_type": "reddit",
                        "title": title,
                        "canonical_url": f"https://www.reddit.com{permalink}",
                        "published_at": published_at,
                        "author": post.get("author"),
                        "content": post.get("selftext") or post.get("url_overridden_by_dest") or "",
                        "excerpt": (post.get("selftext") or title)[:500],
                        "image_url": post.get("thumbnail")
                        if str(post.get("thumbnail", "")).startswith("http")
                        else None,
                        "tags": ["reddit", subreddit, "discussion", "top"],
                        "raw_metadata": {
                            "score": post.get("score"),
                            "num_comments": post.get("num_comments"),
                            "subreddit": subreddit,
                            "discussion_url": f"https://www.reddit.com{permalink}",
                        },
                    }
                )
        return items


class HackerNewsProvider(BaseProvider):
    slug = "hacker-news"

    def __init__(
        self,
        *,
        base_url: str | None = None,
        story_limit: int | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = (base_url or settings.hacker_news_base_url).rstrip("/")
        self.story_limit = story_limit or settings.hacker_news_story_limit
        self._client = client

    async def _get_json(self, path: str) -> Any:
        owns_client = self._client is None
        client = self._client or httpx.AsyncClient(timeout=20.0)
        try:
            response = await client.get(f"{self.base_url}/{path}")
            response.raise_for_status()
            return response.json()
        finally:
            if owns_client:
                await client.aclose()

    def _normalize_story(self, item: dict[str, Any]) -> dict[str, Any] | None:
        item_type = item.get("type")
        if item_type not in {"story", "job", "poll"}:
            return None

        title = unescape(item.get("title") or "").strip()
        if not title:
            return None

        url = item.get("url") or f"https://news.ycombinator.com/item?id={item['id']}"
        published_at = None
        if item.get("time"):
            published_at = datetime.fromtimestamp(item["time"], tz=UTC)

        host = urlparse(url).netloc or "news.ycombinator.com"
        tags = ["hacker-news", item_type, host]
        if item.get("score", 0) >= 100:
            tags.append("high-score")
        if item.get("descendants", 0) >= 50:
            tags.append("high-discussion")

        excerpt = _strip_html_tags(unescape(item.get("text") or "")).strip() or title

        return {
            "external_id": str(item["id"]),
            "source_slug": self.slug,
            "source_name": "Hacker News",
            "source_type": "hacker-news",
            "title": title,
            "canonical_url": url,
            "published_at": published_at,
            "author": item.get("by"),
            "content": unescape(item.get("text") or ""),
            "excerpt": excerpt[:500],
            "tags": tags,
            "raw_metadata": {
                "hn_id": item["id"],
                "hn_type": item_type,
                "hn_score": item.get("score"),
                "hn_descendants": item.get("descendants"),
                "hn_kids": item.get("kids", []),
                "discussion_url": f"https://news.ycombinator.com/item?id={item['id']}",
            },
        }

    async def fetch_items(self) -> list[dict[str, Any]]:
        try:
            story_ids = await self._get_json("topstories.json")
        except Exception:
            return []
        if not isinstance(story_ids, list):
            return []

        selected_ids = story_ids[: self.story_limit]
        owns_client = self._client is None
        client = self._client or httpx.AsyncClient(timeout=20.0)
        try:
            responses = await asyncio.gather(
                *[client.get(f"{self.base_url}/item/{story_id}.json") for story_id in selected_ids]
            )
        except Exception:
            responses = []
        finally:
            if owns_client:
                await client.aclose()

        normalized: list[dict[str, Any]] = []
        for response in responses:
            if response.status_code >= 400:
                continue
            item = response.json()
            if not isinstance(item, dict):
                continue
            normalized_item = self._normalize_story(item)
            if normalized_item is not None:
                normalized.append(normalized_item)
        return normalized
