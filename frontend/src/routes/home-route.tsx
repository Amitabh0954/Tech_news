import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { CriticalAlertStrip } from "@/components/news/critical-alert-strip";
import { FrontPageLead } from "@/components/news/front-page-lead";
import { NewsRiver } from "@/components/news/news-river";
import { NewStoriesBanner } from "@/components/news/new-stories-banner";
import { StoryRow } from "@/components/news/story-row";
import { StoryTile } from "@/components/news/story-tile";
import { DATE_FILTER_LABELS } from "@/lib/date-filters";
import { useCriticalStories, useNewsFeed } from "@/features/articles/queries";
import { useDismissedIds } from "@/features/dismissals/queries";
import { useUIStore } from "@/stores/ui-store";

export function HomeRoute() {
  const { data: criticalStories } = useCriticalStories();
  // The category/date filters live in the URL (not just the store) so the browser's
  // back/forward buttons actually move between filtered views instead of no-oping.
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const activeDays = searchParams.get("days") ? Number(searchParams.get("days")) : null;
  const setActiveCategory = useUIStore((state) => state.setActiveCategory);
  const setActiveDays = useUIStore((state) => state.setActiveDays);

  useEffect(() => {
    setActiveCategory(activeCategory);
    setActiveDays(activeDays);
  }, [activeCategory, activeDays, setActiveCategory, setActiveDays]);

  const { data: newsFeed, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNewsFeed(activeCategory, activeDays);
  const { data: dismissedIds } = useDismissedIds();

  const dismissedIdSet = new Set(dismissedIds ?? []);
  const items = (newsFeed?.pages.flatMap((page) => page.items) ?? []).filter((item) => !dismissedIdSet.has(item.id));

  // The full river below stays newest-first. But for the featured lead/secondary
  // slots, surface the highest-impact story among recent stories instead of
  // whichever happened to publish last — a 9.4 from two hours ago should lead
  // over a 5.8 from ten minutes ago.
  const RECENCY_WINDOW = 18;
  // Slice(1, 5) instead of (1, 3): the right rail had visible empty space below the
  // first two thumbnails, so this surfaces two more high-impact stories to fill it.
  const featuredCandidates = [...items.slice(0, RECENCY_WINDOW)].sort((a, b) => b.impact_score - a.impact_score);
  const leadStory = featuredCandidates[0] ?? items[0];
  const secondaryStories = featuredCandidates.slice(1, 5);
  // The secondary rail (4 image cards) runs taller than the lead's text+image column,
  // which left dead space under the lead. Filling with more compact rows (rather than
  // shrinking the secondary rail) is the fix that actually keeps both columns level —
  // pull enough candidates that the left column can grow to roughly match the right.
  const leadFillerStories = featuredCandidates.slice(5, 12);
  const featuredIds = new Set(
    [leadStory?.id, ...secondaryStories.map((story) => story.id), ...leadFillerStories.map((story) => story.id)].filter(
      Boolean,
    ),
  );
  const riverStories = items.filter((item) => !featuredIds.has(item.id));

  return (
    <div className="space-y-8">
      <section className="border-b border-border pb-6 dark:border-white/10">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Daily intelligence brief</div>
        <h1 className="mt-3 max-w-4xl font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.07em] text-zinc-900 dark:text-white sm:text-5xl">
          Executive insight for the modern engineering leader
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-700 dark:text-slate-300">
          High-signal coverage of AI advances, security incidents, cloud platform changes, supply-chain risk, and the
          tooling shifts shaping engineering execution.
        </p>
        {activeDays ? (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">
              {DATE_FILTER_LABELS[String(activeDays)] ?? `Last ${activeDays} days`}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("days");
                navigate(next.toString() ? `/app?${next.toString()}` : "/app");
              }}
              className="text-zinc-500 hover:text-accent dark:text-slate-400"
            >
              Clear
            </button>
          </div>
        ) : null}
      </section>

      <NewStoriesBanner queryKeys={[["news-feed", activeCategory], ["critical-stories"]]} />

      {criticalStories?.length ? <CriticalAlertStrip items={criticalStories} /> : null}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse border border-border bg-panel" />
          ))}
        </div>
      ) : isError ? (
        <div className="border border-critical/30 bg-critical/5 p-8 text-zinc-700 dark:text-slate-200">
          <div className="text-sm font-semibold text-critical">News feed unavailable</div>
          <div className="mt-2 text-sm">
            {(error as Error | undefined)?.message ??
              "The frontend could not reach the FastAPI backend. Start the backend and check VITE_API_BASE_URL."}
          </div>
        </div>
      ) : leadStory ? (
        <div className="space-y-10">
          <section className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <FrontPageLead article={leadStory} />
              {leadFillerStories.length ? (
                <div className="mt-6 border-t border-border pt-2 dark:border-white/10">
                  {leadFillerStories.map((article) => (
                    <StoryRow key={article.id} article={article} />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="space-y-8 border-l border-border pl-0 xl:pl-8 dark:border-white/10">
              {secondaryStories.map((article) => (
                <StoryTile key={article.id} article={article} imageAspect="square" />
              ))}
            </div>
          </section>

          <NewsRiver
            items={riverStories}
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={() => void fetchNextPage()}
          />
        </div>
      ) : (
        <div className="border border-border bg-panel p-8 text-zinc-600 dark:border-white/10 dark:text-slate-300">
          No stories were returned by the configured sources yet.
        </div>
      )}
    </div>
  );
}
