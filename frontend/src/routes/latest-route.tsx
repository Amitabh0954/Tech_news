import { NewsRiver } from "@/components/news/news-river";
import { NewStoriesBanner } from "@/components/news/new-stories-banner";
import { useLatestNews } from "@/features/articles/queries";

export function LatestRoute() {
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useLatestNews();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-8">
      <section className="border-b border-border pb-6 dark:border-white/10">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Live feed</div>
        <h1 className="mt-3 max-w-4xl font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.07em] text-slate-900 dark:text-white sm:text-5xl">
          Latest
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700 dark:text-slate-300">
          The newest stories as they're ingested, in strict chronological order.
        </p>
      </section>

      <NewStoriesBanner queryKeys={[["latest-feed"]]} />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse border border-border bg-panel dark:border-white/10" />
          ))}
        </div>
      ) : isError ? (
        <div className="border border-critical/30 bg-critical/5 p-8 text-slate-700 dark:text-slate-200">
          <div className="text-sm font-semibold text-critical">Latest feed unavailable</div>
          <div className="mt-2 text-sm">
            {(error as Error | undefined)?.message ??
              "The frontend could not reach the FastAPI backend. Start the backend and check VITE_API_BASE_URL."}
          </div>
        </div>
      ) : items.length ? (
        <NewsRiver
          title="Latest"
          items={items}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={() => void fetchNextPage()}
        />
      ) : (
        <div className="border border-border bg-panel p-8 text-slate-600 dark:border-white/10 dark:text-slate-300">
          No stories were returned by the configured sources yet.
        </div>
      )}
    </div>
  );
}
