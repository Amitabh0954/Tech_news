import { Link } from "react-router-dom";

import { useBookmarkStore } from "@/stores/bookmark-store";

export function BookmarksRoute() {
  const savedSlugs = useBookmarkStore((state) => state.savedSlugs);

  return (
    <section className="border border-border bg-panel p-6 dark:border-white/10">
      <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">Bookmarks</div>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-zinc-900 dark:text-white">
        Saved articles
      </h1>
      <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-slate-300">Local saves work now, and the backend bookmark API is scaffolded for authenticated sync.</p>
      <div className="mt-6 space-y-3">
        {savedSlugs.length ? (
          savedSlugs.map((slug) => (
            <Link
              key={slug}
              to={`/app/article/${slug}`}
              className="block border border-border bg-background/40 px-4 py-3 text-sm text-zinc-800 dark:border-white/10 dark:text-slate-200"
            >
              {slug}
            </Link>
          ))
        ) : (
          <div className="border border-dashed border-border px-4 py-6 text-sm text-zinc-500 dark:border-white/10 dark:text-slate-400">
            No saved stories yet.
          </div>
        )}
      </div>
    </section>
  );
}
