import { CriticalAlertStrip } from "@/components/news/critical-alert-strip";
import { FrontPageLead } from "@/components/news/front-page-lead";
import { FrontPageSecondary } from "@/components/news/front-page-secondary";
import { NewsRiver } from "@/components/news/news-river";
import { useCriticalStories, useNewsFeed } from "@/features/articles/queries";
import { useUIStore } from "@/stores/ui-store";

export function HomeRoute() {
  const { data: criticalStories } = useCriticalStories();
  const { activeCategory } = useUIStore();
  const { data: newsFeed, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNewsFeed(activeCategory);

  const items = newsFeed?.pages.flatMap((page) => page.items) ?? [];
  const leadStory = items[0];
  const secondaryStories = items.slice(1, 3);
  const riverStories = items.slice(3);

  return (
    <div className="space-y-8">
      <section className="border-b border-border pb-6 dark:border-white/10">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Daily report</div>
        <h1 className="mt-3 max-w-4xl font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.07em] text-zinc-900 dark:text-white sm:text-5xl">
          What serious software engineers must know today
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-700 dark:text-slate-300">
          High-signal reporting on AI breakthroughs, ecosystem risk, security incidents, cloud changes, supply-chain
          events, and developer tooling shifts.
        </p>
      </section>

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
          <section className="grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_380px]">
            <FrontPageLead article={leadStory} />
            <div className="space-y-6 border-l border-border pl-0 xl:pl-8 dark:border-white/10">
              {secondaryStories.map((article, index) => (
                <FrontPageSecondary
                  key={article.id}
                  article={article}
                  eyebrow={index === 0 ? "World at work" : "Cloud & infrastructure"}
                />
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
