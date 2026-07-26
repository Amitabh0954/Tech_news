import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { BookmarkButton } from "@/components/ui/bookmark-button";
import { ShareButton } from "@/components/ui/share-button";
import { StoryCard } from "@/components/news/story-card";
import { StoryTile } from "@/components/news/story-tile";
import { DateLine } from "@/components/news/article-primitives";
import { useNewsFeed, useSummarizeArticle } from "@/features/articles/queries";
import { useArticle } from "@/features/articles/queries";
import { cn, sanitizeFeedHtml } from "@/lib/utils";

// Mirrors ImpactBadge's urgency palette (see components/ui/impact-badge.tsx) but as a
// plain text-color class, so the gauge's SVG strokes (which use stroke="currentColor")
// and the number underneath both pick up the same urgency color from one class.
const URGENCY_TEXT_COLOR: Record<string, string> = {
  critical: "text-critical",
  high: "text-high",
  medium: "text-accent",
  low: "text-low",
};

function ImpactGauge({ score, urgency }: { score: number; urgency: string }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(10, score)) / 10;
  const colorClass = URGENCY_TEXT_COLOR[urgency] ?? URGENCY_TEXT_COLOR.medium;

  return (
    <div className={cn("relative grid h-14 w-14 shrink-0 place-items-center", colorClass)}>
      <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <span className="text-base font-bold text-heading dark:text-white">{score.toFixed(1)}</span>
    </div>
  );
}

export function ArticleRoute() {
  const { slug = "" } = useParams();
  const { data, isLoading } = useArticle(slug);
  const { data: feed } = useNewsFeed(null);
  const summarizeArticle = useSummarizeArticle(slug);
  const [showSummary, setShowSummary] = useState(false);

  const keyPoints = data?.summary?.key_points;
  const overview = data?.summary?.overview;
  const hasGeneratedSummary = Boolean(keyPoints?.length && overview);

  useEffect(() => {
    if (hasGeneratedSummary) {
      setShowSummary(true);
    }
  }, [hasGeneratedSummary]);

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

  // Not necessarily related to this story — just enough other stories (with images) to
  // fill the empty space next to the hero image, the way a wire homepage's side rail does.
  const shownIds = new Set([data.id, ...relatedStories.map((story) => story.id)]);
  const sidebarFillerStories = feedItems.filter((item) => !shownIds.has(item.id)).slice(0, 3);

  return (
    <article className="rounded-[var(--card-radius)] border border-border bg-panel p-6 shadow-[var(--card-shadow)] dark:border-white/10">
      <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-[-0.06em] text-heading dark:text-white">
        {data.title}
      </h1>

      <p className="mt-4 max-w-3xl text-lg leading-7 text-slate-600 dark:text-slate-300">
        <span className="mr-1 text-accent">/</span>
        {data.summary?.why_it_matters ?? data.excerpt}
      </p>

      {/* Two independent columns instead of one grid row: the left column carries the
          image straight into the body sections (What happened, Immediate risks, ...) so
          they start right under the image, while the right column (byline/actions/impact/
          more stories) is free to run shorter without leaving a gap above the body.
          Column proportions (fluid left, fixed 360px right, gap-8) mirror the home page's
          lead/rail split so both pages read as the same layout system. */}
      <div className="mt-6 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {data.image_url ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5 dark:bg-white/5">
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
              {data.source.name} · <DateLine timestamp={data.published_at} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <BookmarkButton articleId={data.id} />
              <ShareButton title={data.title} url={data.canonical_url} />
              <button
                type="button"
                onClick={() => {
                  if (hasGeneratedSummary) {
                    setShowSummary((value) => !value);
                  } else {
                    summarizeArticle.mutate();
                  }
                }}
                disabled={summarizeArticle.isPending}
                className="rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-500 transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-60 dark:border-white/10 dark:text-slate-400"
              >
                {summarizeArticle.isPending ? "Summarizing…" : hasGeneratedSummary ? (showSummary ? "Hide summary" : "Show summary") : "Summary"}
              </button>
            </div>
          </div>
          {summarizeArticle.isError ? (
            <p className="text-sm text-critical">Couldn&apos;t generate a summary right now. Try again in a moment.</p>
          ) : null}

          {showSummary && hasGeneratedSummary ? (
            <section className="border border-accent/20 bg-accent/5 p-4">
              <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">Summary</h2>
              <p className="mb-3 text-sm leading-6 text-slate-700 dark:text-slate-200">{overview}</p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-200">
                {keyPoints?.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">What happened</h2>
            <p className="text-justify text-sm leading-6 text-slate-700 dark:text-slate-200">{data.summary?.what_happened ?? data.excerpt}</p>
          </section>
          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">Immediate risks</h2>
            <p className="text-justify text-sm leading-6 text-slate-700 dark:text-slate-200">{data.summary?.immediate_risks}</p>
          </section>
          {data.ecosystem_tags?.length ? (
            <section>
              <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">Ecosystem tags</h2>
              <div className="flex flex-wrap gap-2">
                {data.ecosystem_tags.map((tag) => (
                  <span key={tag} className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
          {data.content ? (
            <section>
              <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">Story</h2>
              <div
                className="prose prose-zinc max-w-none text-justify text-sm leading-6 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizeFeedHtml(data.content) }}
              />
            </section>
          ) : null}
        </div>

        <div
          className="flex flex-col gap-4 border-l border-transparent pl-0 xl:pl-8"
          style={{ borderImage: "linear-gradient(to bottom, transparent, rgb(var(--accent) / 0.5), transparent) 1" }}
        >
          <div className="space-y-3 border border-border bg-background/40 p-3 dark:border-white/10">
            <div className="flex items-center gap-3">
              <ImpactGauge score={data.impact_score} urgency={data.urgency} />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
                  Impact score
                </div>
                <div
                  className={cn(
                    "mt-1 text-xs font-semibold uppercase tracking-[0.14em]",
                    URGENCY_TEXT_COLOR[data.urgency] ?? URGENCY_TEXT_COLOR.medium,
                  )}
                >
                  {data.urgency}
                </div>
              </div>
            </div>
            {data.impact?.affected_roles?.length ? (
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">Affected roles</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.impact.affected_roles.map((role) => (
                    <span key={role} className="rounded-full border border-border px-2 py-1 text-xs text-slate-700 dark:border-white/10 dark:text-slate-300">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-1">
              <a href={data.canonical_url} target="_blank" rel="noreferrer" className="text-sm text-accent">
                Open original source
              </a>
              {data.discussion_url ? (
                <a href={data.discussion_url} target="_blank" rel="noreferrer" className="text-sm text-slate-600 dark:text-slate-300">
                  Open discussion thread
                </a>
              ) : null}
            </div>
          </div>

          {sidebarFillerStories.length ? (
            <div className="space-y-8 border-t border-border pt-4 dark:border-white/10">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">More stories</div>
              {sidebarFillerStories.map((story) => (
                <StoryTile key={story.id} article={story} imageAspect="square" />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {relatedStories.length ? (
        <section className="mt-8">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">Suggested stories</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedStories.map((story) => (
              <StoryCard key={story.id} article={story} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
