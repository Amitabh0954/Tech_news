import { useState } from "react";

import { StoryCard } from "@/components/news/story-card";
import { useSearchNews } from "@/features/articles/queries";

export function SearchRoute() {
  const [query, setQuery] = useState("supply chain");
  const { data, isLoading } = useSearchNews(query);

  return (
    <section className="border border-border bg-panel p-6 dark:border-white/10">
      <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">Search</div>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-zinc-900 dark:text-white">
        Search by engineering signal
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-700 dark:text-slate-300">
        Query incidents, platform changes, AI model releases, or ecosystem shifts. This surface can later swap to
        semantic search without changing the user workflow.
      </p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search CVEs, cloud outages, model releases..."
        className="mt-5 w-full border border-border bg-background px-4 py-3 text-sm text-zinc-900 outline-none dark:border-white/10 dark:text-white"
      />
      <div className="mt-6 space-y-4">
        {isLoading ? <div className="h-40 animate-pulse border border-border bg-background dark:border-white/10" /> : null}
        {data?.items.map((item) => (
          <StoryCard key={item.id} article={item} />
        ))}
      </div>
    </section>
  );
}
