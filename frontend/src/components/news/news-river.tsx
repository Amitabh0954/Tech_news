import { useEffect, useRef } from "react";

import type { Article } from "@/lib/api";
import { StoryRow } from "@/components/news/story-row";
import { StoryTile } from "@/components/news/story-tile";
import { useDismissedIds } from "@/features/dismissals/queries";

// First page-and-a-bit renders as an image-led card grid (visual, scannable at a
// glance) — 24 items is 5-6 rows at the grid's 4/3-column breakpoints. Once a reader
// has scrolled past that, later stories render as the denser text-first row list
// instead — repeating the card treatment for dozens of items in a row stopped reading
// as "important" and just made the page long without adding clarity.
const GRID_ITEM_COUNT = 24;

// Auto-loading more pages forever (as long as the sentinel is on screen) means the feed
// never ends and a reader can never reach a footer. Capping how many stories the river
// will auto-fetch gives scrolling a natural stopping point; "Load more" past this point
// is still one explicit click away.
const AUTO_LOAD_ITEM_CAP = 64;

export function NewsRiver({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  title = "Top Engineering Stories",
}: {
  items: Article[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  title?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { data: dismissedIds } = useDismissedIds();
  const dismissedIdSet = new Set(dismissedIds ?? []);
  // Filtered here (not just by callers) so every consumer of NewsRiver gets
  // dismissed-article filtering for free, including ones added later.
  items = items.filter((article) => !dismissedIdSet.has(article.id));
  const reachedAutoLoadCap = items.length >= AUTO_LOAD_ITEM_CAP;
  const canAutoLoad = hasNextPage && !reachedAutoLoadCap;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canAutoLoad) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [canAutoLoad, fetchNextPage, isFetchingNextPage]);

  const gridItems = items.slice(0, GRID_ITEM_COUNT);
  const listItems = items.slice(GRID_ITEM_COUNT);

  return (
    <section className="border-t border-border pt-8 dark:border-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-500">
          {title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-500">{items.length} stories</div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {gridItems.map((article) => (
          <StoryTile key={article.id} article={article} />
        ))}
      </div>

      {listItems.length ? (
        <div className="mt-10 border-t border-border dark:border-white/10">
          {listItems.map((article) => (
            <StoryRow key={article.id} article={article} />
          ))}
        </div>
      ) : null}

      {canAutoLoad ? <div ref={sentinelRef} className="h-8" /> : null}
      {isFetchingNextPage ? (
        <div className="pt-4 text-sm text-slate-500 dark:text-slate-500">Loading more engineering signal...</div>
      ) : hasNextPage && reachedAutoLoadCap ? (
        <div className="flex justify-center pt-6">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-accent/40 hover:text-accent dark:border-white/10 dark:text-slate-200"
          >
            Load more stories
          </button>
        </div>
      ) : !hasNextPage ? (
        <div className="pt-6 text-center text-sm text-slate-500 dark:text-slate-500">
          You&apos;re all caught up — that&apos;s every story we&apos;ve got right now.
        </div>
      ) : null}
    </section>
  );
}
