import { StoryCard } from "@/components/news/story-card";
import { useBookmarks } from "@/features/bookmarks/queries";

export function BookmarksRoute() {
  const { data: bookmarks, isLoading, isError } = useBookmarks();

  return (
    <section className="border border-border bg-panel p-6 dark:border-white/10">
      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-500">Bookmarks</div>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-slate-900 dark:text-white">
        Saved articles
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
        Stories you save are stored on your account and stay available across devices.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse border border-border bg-background/40 dark:border-white/10" />
          ))
        ) : isError ? (
          <div className="col-span-full border border-critical/30 bg-critical/5 px-4 py-6 text-sm text-critical">
            Could not load your saved articles. Try refreshing the page.
          </div>
        ) : bookmarks?.length ? (
          bookmarks.map((article) => <StoryCard key={article.id} article={article} />)
        ) : (
          <div className="col-span-full border border-dashed border-border px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            No saved stories yet. Tap "Save" on any article to add it here.
          </div>
        )}
      </div>
    </section>
  );
}
