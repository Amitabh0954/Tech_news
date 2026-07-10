import { useParams } from "react-router-dom";

import { BookmarkButton } from "@/components/ui/bookmark-button";
import { ShareButton } from "@/components/ui/share-button";
import { ImpactBadge } from "@/components/ui/impact-badge";
import { StoryCard } from "@/components/news/story-card";
import { DateLine } from "@/components/news/article-primitives";
import { useNewsFeed } from "@/features/articles/queries";
import { useArticle } from "@/features/articles/queries";
import { sanitizeFeedHtml } from "@/lib/utils";

export function ArticleRoute() {
  const { slug = "" } = useParams();
  const { data, isLoading } = useArticle(slug);
  const { data: feed } = useNewsFeed(null);

  if (isLoading) {
    return <div className="h-96 animate-pulse border border-border bg-panel dark:border-white/10" />;
  }

  if (!data) {
    return <div className="border border-border bg-panel p-6 dark:border-white/10">Article not found.</div>;
  }

  const feedItems = feed?.pages.flatMap((page) => page.items) ?? [];
  const relatedStories = feedItems
    .filter((item) => item.slug !== data.slug)
    .filter(
      (item) =>
        (data.category && item.category && data.category.slug === item.category.slug) ||
        item.source.slug === data.source.slug ||
        (data.ecosystem_tags ?? []).some((tag) => item.ecosystem_tags?.includes(tag)),
    )
    .slice(0, 3);

  return (
    <article className="border border-border bg-panel p-6 dark:border-white/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <ImpactBadge score={data.impact_score} urgency={data.urgency} />
        <div className="flex items-center gap-3">
          <BookmarkButton articleId={data.id} />
          <ShareButton title={data.title} url={data.canonical_url} />
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-slate-500">
            {data.source.name} · <DateLine timestamp={data.published_at} />
          </div>
        </div>
      </div>
      <h1 className="font-heading text-4xl font-semibold leading-[1.08] tracking-[-0.06em] text-zinc-900 dark:text-white">
        {data.title}
      </h1>
      {data.image_url ? (
        <div className="relative mt-6 aspect-[21/9] w-full overflow-hidden bg-black/5 dark:bg-white/5">
          <img
            src={data.image_url}
            alt={data.title}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.parentElement?.style.setProperty("display", "none");
            }}
          />
        </div>
      ) : null}
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">What happened</h2>
            <p className="text-sm leading-6 text-zinc-700 dark:text-slate-200">{data.summary?.what_happened ?? data.excerpt}</p>
          </section>
          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">Why this matters</h2>
            <p className="text-sm leading-6 text-zinc-700 dark:text-slate-200">{data.summary?.why_it_matters}</p>
          </section>
          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">Immediate risks</h2>
            <p className="text-sm leading-6 text-zinc-700 dark:text-slate-200">{data.summary?.immediate_risks}</p>
          </section>
          {data.ecosystem_tags?.length ? (
            <section>
              <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">Ecosystem tags</h2>
              <div className="flex flex-wrap gap-2">
                {data.ecosystem_tags.map((tag) => (
                  <span key={tag} className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
          {data.content ? (
            <section>
              <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">Story</h2>
              <div
                className="prose prose-zinc max-w-none text-sm leading-6 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizeFeedHtml(data.content) }}
              />
            </section>
          ) : null}
          {relatedStories.length ? (
            <section>
              <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">Suggested stories</h2>
              <div className="grid gap-4">
                {relatedStories.map((story) => (
                  <StoryCard key={story.id} article={story} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
        <aside className="space-y-4 border border-border bg-background/40 p-4 dark:border-white/10">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">Impact score</div>
            <div className="mt-2 text-4xl font-semibold text-zinc-900 dark:text-white">{data.impact_score.toFixed(1)}</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">Affected roles</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.impact?.affected_roles?.map((role) => (
                <span key={role} className="rounded-full border border-border px-2 py-1 text-xs text-zinc-700 dark:border-white/10 dark:text-slate-300">
                  {role}
                </span>
              ))}
            </div>
          </div>
          <a href={data.canonical_url} target="_blank" rel="noreferrer" className="block text-sm text-accent">
            Open original source
          </a>
          {data.discussion_url ? (
            <a href={data.discussion_url} target="_blank" rel="noreferrer" className="block text-sm text-zinc-600 dark:text-slate-300">
              Open discussion thread
            </a>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
