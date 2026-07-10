import type { QueryKey } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";
import { useLiveFeedStore } from "@/stores/live-feed-store";

export function NewStoriesBanner({ queryKeys }: { queryKeys: QueryKey[] }) {
  const newCount = useLiveFeedStore((state) => state.newCount);
  const reset = useLiveFeedStore((state) => state.reset);

  if (!newCount) {
    return null;
  }

  const handleClick = async () => {
    await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={() => void handleClick()}
        className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent shadow-sm transition hover:bg-accent/20"
      >
        {newCount} new {newCount === 1 ? "story" : "stories"} — click to load
      </button>
    </div>
  );
}
