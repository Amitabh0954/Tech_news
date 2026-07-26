import { useEffect, useRef, type ReactNode } from "react";

import type { Article } from "@/lib/api";

export function CardGrid({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  renderCard,
}: {
  items: Article[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  renderCard: (article: Article) => ReactNode;
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
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((article) => (
          <div key={article.id}>{renderCard(article)}</div>
        ))}
      </div>
      <div ref={sentinelRef} className="h-8" />
      {isFetchingNextPage ? (
        <div className="pt-4 text-sm text-slate-500 dark:text-slate-500">Loading more...</div>
      ) : null}
    </div>
  );
}
