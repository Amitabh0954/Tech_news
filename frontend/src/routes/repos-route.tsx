import { CardGrid } from "@/components/news/card-grid";
import { RepoCard } from "@/components/news/repo-card";
import { useReposFeed } from "@/features/articles/queries";

export function ReposRoute() {
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useReposFeed();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-8">
      <section className="border-b border-border pb-6 dark:border-white/10">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Open source</div>
        <h1 className="mt-3 max-w-4xl font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.07em] text-slate-900 dark:text-white sm:text-5xl">
          Repos
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700 dark:text-slate-300">
          Repositories created in the last week, ranked by star count — GitHub's trending page, aggregated.
        </p>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse border border-border bg-panel dark:border-white/10" />
          ))}
        </div>
      ) : isError ? (
        <div className="border border-critical/30 bg-critical/5 p-8 text-slate-700 dark:text-slate-200">
          <div className="text-sm font-semibold text-critical">Repos feed unavailable</div>
          <div className="mt-2 text-sm">
            {(error as Error | undefined)?.message ??
              "The frontend could not reach the FastAPI backend. Start the backend and check VITE_API_BASE_URL."}
          </div>
        </div>
      ) : items.length ? (
        <CardGrid
          items={items}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={() => void fetchNextPage()}
          renderCard={(article) => <RepoCard article={article} />}
        />
      ) : (
        <div className="border border-border bg-panel p-8 text-slate-600 dark:border-white/10 dark:text-slate-300">
          No trending repos have been ingested yet.
        </div>
      )}
    </div>
  );
}
