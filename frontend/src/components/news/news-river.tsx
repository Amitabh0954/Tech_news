import { useEffect, useRef } from "react";

import type { Article } from "@/lib/api";
import { StoryRow } from "@/components/news/story-row";

export function NewsRiver({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  items: Article[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <section className="border-t border-border pt-8 dark:border-white/10">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-slate-500">
          Top Engineering Stories
        </div>
        <div className="text-xs text-zinc-500 dark:text-slate-500">{items.length} stories</div>
      </div>
      <div>
        {items.map((article) => (
          <StoryRow key={article.id} article={article} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-8" />
      {isFetchingNextPage ? (
        <div className="pt-4 text-sm text-zinc-500 dark:text-slate-500">Loading more engineering signal...</div>
      ) : null}
    </section>
  );
}
