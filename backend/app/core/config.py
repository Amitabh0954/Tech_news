from functools import lru_cache
from urllib.parse import quote

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_database_url(url: str) -> str:
    """Repair legacy Postgres URLs with an unescaped @ in the password."""
    if "://" not in url or url.count("@") <= 1:
        return url

    scheme, remainder = url.split("://", 1)
    credentials, host = remainder.rsplit("@", 1)

    if ":" not in credentials:
        return url

    username, password = credentials.split(":", 1)
    return f"{scheme}://{username}:{quote(password, safe='')}@{host}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Engineering Intelligence API"
    app_env: str = "development"
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:amit%400954@localhost:5432/Tech_news?ssl=prefer"
    )
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    secret_key: str = Field(default="your-super-secret-key-change-this-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    # OAuth client ID from Google Cloud Console (Credentials -> OAuth client ID -> Web
    # application). Must match VITE_GOOGLE_CLIENT_ID on the frontend. Google sign-in is
    # disabled until this is set.
    google_client_id: str | None = None
    # Public origin this backend is reachable at. Required so image URLs served from
    # local static files (see services/images.py) are absolute — the frontend is
    # typically deployed on a different origin (e.g. Vercel), so a relative "/images/..."
    # path would resolve against the frontend's own domain and 404.
    public_base_url: str = "http://localhost:8000"
    default_llm_provider: str = "gemma"
    huggingface_api_token: str | None = None
    gemma_model_id: str = "google/gemma-4-31B-it"
    gemma_device_map: str = "auto"
    gemma_max_new_tokens: int = 512
    gemma_temperature: float = 0.1
    gemma_top_p: float = 0.9
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    github_token: str | None = None
    github_repository_queries: list[str] = ["ai", "kubernetes", "typescript", "github actions security"]
    github_repository_limit_per_query: int = 3
    # GitHub has no official "trending" API, so this uses the same heuristic most
    # trending-repo tools rely on: repos created within the last N days, sorted by star
    # count. Works fully unauthenticated (falls back to github_token if set, for a higher
    # rate limit) — an empty string language entry means "all languages", matching the
    # "All" tab on github.com/trending.
    github_trending_languages: list[str] = ["", "python", "typescript", "rust", "go"]
    github_trending_days: int = 7
    github_trending_limit_per_query: int = 8
    # README fetches hit GitHub's core API (60/hour unauthenticated, shared with every
    # other unauthenticated caller from this IP) rather than the search API, so this caps
    # how many *new* (not-already-cached) repos get a README fetch per ingestion cycle.
    github_trending_readme_fetch_limit: int = 12
    reddit_user_agent: str = "engintel-newsportal/0.1"
    reddit_top_urls: list[str] = [
        "https://www.reddit.com/r/programming/top.json?t=day&limit=25",
        "https://www.reddit.com/r/softwareengineering/top.json?t=day&limit=25",
        "https://www.reddit.com/r/webdev/top.json?t=day&limit=25",
        "https://www.reddit.com/r/reactjs/top.json?t=day&limit=25",
        "https://www.reddit.com/r/nextjs/top.json?t=day&limit=25",
        "https://www.reddit.com/r/typescript/top.json?t=day&limit=25",
        "https://www.reddit.com/r/javascript/top.json?t=day&limit=25",
        "https://www.reddit.com/r/Python/top.json?t=day&limit=25",
        "https://www.reddit.com/r/rust/top.json?t=day&limit=25",
        "https://www.reddit.com/r/golang/top.json?t=day&limit=25",
        "https://www.reddit.com/r/MachineLearning/top.json?t=day&limit=25",
        "https://www.reddit.com/r/LocalLLaMA/top.json?t=day&limit=25",
        "https://www.reddit.com/r/artificial/top.json?t=day&limit=25",
        "https://www.reddit.com/r/singularity/top.json?t=day&limit=25",
        "https://www.reddit.com/r/ChatGPT/top.json?t=day&limit=25",
        "https://www.reddit.com/r/cybersecurity/top.json?t=day&limit=25",
        "https://www.reddit.com/r/netsec/top.json?t=day&limit=25",
        "https://www.reddit.com/r/blueteamsec/top.json?t=day&limit=25",
        "https://www.reddit.com/r/hacking/top.json?t=day&limit=25",
        "https://www.reddit.com/r/devops/top.json?t=day&limit=25",
        "https://www.reddit.com/r/kubernetes/top.json?t=day&limit=25",
        "https://www.reddit.com/r/docker/top.json?t=day&limit=25",
        "https://www.reddit.com/r/selfhosted/top.json?t=day&limit=25",
        "https://www.reddit.com/r/linux/top.json?t=day&limit=25",
        "https://www.reddit.com/r/ExperiencedDevs/top.json?t=day&limit=25",
    ]
    reddit_story_limit_per_feed: int = 2
    rss_feed_urls: list[str] = [
        "https://techcrunch.com/feed/",
        "https://feeds.arstechnica.com/arstechnica/index",
        "https://www.theverge.com/rss/index.xml",
        "https://www.engadget.com/rss.xml",
        "https://venturebeat.com/feed/",
        "https://www.wired.com/feed/rss",
        "https://hnrss.org/frontpage",
        "https://github.blog/feed/",
        "https://developers.googleblog.com/feeds/posts/default",
        "https://aws.amazon.com/blogs/aws/feed/",
        "https://devblogs.microsoft.com/feed/",
        "https://openai.com/news/rss.xml",
        "https://blog.cloudflare.com/rss/",
        "https://blogs.nvidia.com/feed/",
        "https://www.anthropic.com/news/rss.xml",
        "https://simonwillison.net/atom/everything/",
        "https://huggingface.co/blog/feed.xml",
        "https://www.latent.space/feed",
        "https://netflixtechblog.com/feed",
        "https://www.uber.com/blog/engineering/rss/",
        "https://vercel.com/atom",
        "https://react.dev/rss.xml",
        "https://www.docker.com/blog/feed/",
        "https://feed.infoq.com/",
        "https://news.ycombinator.com/rss",
        "https://krebsonsecurity.com/feed/",
        "https://snyk.io/blog/feed/",
        "https://feeds.feedburner.com/TheHackersNews",
        "https://kubernetes.io/feed.xml",
        "https://thenewstack.io/feed/",
        "https://stackoverflow.blog/feed/",
        "https://engineering.fb.com/feed/",
        "https://slack.engineering/feed/",
        "https://stripe.com/blog/feed.rss",
        "https://about.gitlab.com/atom.xml",
        "https://www.digitalocean.com/blog/rss",
        "https://www.smashingmagazine.com/feed/",
        "https://css-tricks.com/feed/",
        "https://dev.to/feed",
        "https://www.theregister.com/headlines.atom",
        "https://www.bleepingcomputer.com/feed/",
        "https://martinfowler.com/feed.atom",
        "https://blog.jetbrains.com/feed/",
        "https://spectrum.ieee.org/feeds/feed.rss",
        "https://blog.pragmaticengineer.com/rss/",
        "https://eng.lyft.com/feed",
    ]
    rss_story_limit_per_feed: int = 8
    # arXiv's own public RSS feeds (export.arxiv.org) for the "Papers" tab.
    arxiv_feed_urls: list[str] = [
        "https://export.arxiv.org/rss/cs.AI",
        "https://export.arxiv.org/rss/cs.LG",
        "https://export.arxiv.org/rss/cs.CL",
    ]
    # Hugging Face's public "daily papers" API (same data backing huggingface.co/papers) —
    # community-curated/upvoted trending papers, complementing the raw arXiv listings above.
    huggingface_daily_papers_api_url: str = "https://huggingface.co/api/daily_papers"
    hacker_news_base_url: str = "https://hacker-news.firebaseio.com/v0"
    hacker_news_story_limit: int = 20
    llm_relevance_enabled: bool = False
    ingestion_interval_minutes: int = 3
    # Retention: articles older than this are candidates for cleanup, but pruning only
    # kicks in once the table actually holds enough rows to matter — a small dataset
    # is cheap to keep in full, and bookmarked articles are always kept regardless of age.
    article_retention_days: int = 30
    article_retention_min_rows: int = 5000
    retention_cleanup_interval_hours: int = 24

    @property
    def normalized_database_url(self) -> str:
        return _normalize_database_url(self.database_url)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.database_url = settings.normalized_database_url
    return settings


settings = get_settings()
