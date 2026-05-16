from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Engineering Intelligence API"
    app_env: str = "development"
    database_url: str = Field(
        default="postgresql+asyncpg://engintel:engintel@localhost:5432/engintel"
    )
    cors_origins: list[str] = ["http://localhost:5173"]
    default_llm_provider: str = "gemma"
    huggingface_api_token: str | None = None
    gemma_model_id: str = "google/gemma-4-31B-it"
    gemma_device_map: str = "auto"
    gemma_max_new_tokens: int = 512
    gemma_temperature: float = 0.1
    gemma_top_p: float = 0.9
    github_token: str | None = None
    github_repository_queries: list[str] = ["ai", "kubernetes", "typescript", "github actions security"]
    github_repository_limit_per_query: int = 3
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
        "https://openai.com/news/rss.xml",
        "https://www.anthropic.com/news/rss.xml",
        "https://simonwillison.net/atom/everything/",
        "https://huggingface.co/blog/feed.xml",
        "https://www.latent.space/feed",
        "https://blog.cloudflare.com/rss/",
        "https://aws.amazon.com/new/feed/",
        "https://aws.amazon.com/blogs/aws/feed/",
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
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA",
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCbRP3c757lWg9M-U7TyEkXA",
        "https://www.youtube.com/feeds/videos.xml?channel_id=UC8ENHE5xdFSwx71u3fDH5Xw",
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCXgGY0wkgOzynnHvSEVmE3A",
        "https://www.youtube.com/feeds/videos.xml?channel_id=UC8butISFwT-Wl7EV0hUK0BQ",
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCeVMnSShP_Iviwkknt83cww",
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCiEHVhv0SBMpP75JbzJShqw",
    ]
    rss_story_limit_per_feed: int = 8
    hacker_news_base_url: str = "https://hacker-news.firebaseio.com/v0"
    hacker_news_story_limit: int = 20
    llm_relevance_enabled: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
