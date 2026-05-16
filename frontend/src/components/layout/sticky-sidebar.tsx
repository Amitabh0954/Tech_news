import { useCategories } from "@/features/filters/queries";
import { useNewsFeed, useTrendingTopics } from "@/features/articles/queries";
import { useUIStore } from "@/stores/ui-store";

export function StickySidebar() {
  const { data: categories } = useCategories();
  const { data: trending } = useTrendingTopics();
  const { data: feed } = useNewsFeed(null);
  const { activeCategory, setActiveCategory } = useUIStore();
  const feedItems = feed?.pages.flatMap((page) => page.items) ?? [];
  const topSources = Array.from(new Map(feedItems.map((item) => [item.source.slug, item.source])).values()).slice(0, 4);
  const topStories = [...feedItems].sort((a, b) => b.impact_score - a.impact_score).slice(0, 4);

  return (
    <aside className="top-24 hidden h-fit space-y-6 lg:sticky lg:block">
      <section className="border-l border-border pl-6">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">
          My Wire
        </div>
        <div className="space-y-2">
          <button
            className={`w-full border-b pb-2 text-left text-sm ${
              activeCategory === null
                ? "border-accent text-accent"
                : "border-border text-zinc-700 dark:border-white/10 dark:text-slate-300"
            }`}
            onClick={() => setActiveCategory(null)}
          >
            All signal
          </button>
          {categories?.map((category) => (
            <button
              key={category.id}
              className={`w-full border-b pb-2 text-left text-sm ${
                activeCategory === category.slug
                  ? "border-accent text-accent"
                  : "border-border text-zinc-700 dark:border-white/10 dark:text-slate-300"
              }`}
              onClick={() => setActiveCategory(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="border border-border bg-panel p-6">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">
          Trending Engineering Discussions
        </div>
        <div className="space-y-4">
          {trending?.map((item) => (
            <div key={item.topic} className="border-b border-border pb-4 last:border-b-0 last:pb-0 dark:border-white/10">
              <div className="text-sm font-medium text-zinc-900 dark:text-white">{item.topic}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-slate-500">
                <span>{item.mentions} mentions</span>
                <span className="font-mono">{item.momentum.toFixed(1)}x</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-border bg-panel p-6">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">
          Engineering Brief
        </div>
        <div className="aspect-[4/5] border border-border bg-[radial-gradient(circle_at_top,rgba(227,97,0,0.10),transparent_35%),linear-gradient(180deg,#fff_0%,#f7f3ee_100%)] p-6 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(227,97,0,0.15),transparent_35%),linear-gradient(180deg,#121212_0%,#0a0a0a_100%)]">
          <div className="text-xs uppercase tracking-[0.24em] text-accent">EngIntel</div>
          <div className="mt-8 font-heading text-5xl font-semibold leading-none tracking-[-0.07em] text-zinc-900 dark:text-white">
            Pure signal
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-slate-300">
            Briefings on AI, supply chain, cloud outages, platform risk, and the developer ecosystem.
          </p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-slate-500">
              <span>Stories loaded</span>
              <span className="font-mono">{feedItems.length}</span>
            </div>
            <div className="space-y-2">
              {topStories.length ? (
                topStories.map((story) => (
                  <div
                    key={story.id}
                    className="border border-border bg-white/70 px-3 py-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-slate-500">
                      {story.category?.name ?? "Signal"} . {story.impact_score.toFixed(1)}
                    </div>
                    <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-slate-100">{story.title}</div>
                  </div>
                ))
              ) : null}
            </div>
            <div className="space-y-2">
              {topSources.length ? (
                topSources.map((source) => (
                  <div
                    key={source.slug}
                    className="flex items-center justify-between border border-border bg-white/70 px-3 py-2 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    <span>{source.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-slate-500">{source.source_type}</span>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-border px-3 py-5 text-sm text-zinc-500 dark:border-white/10 dark:text-slate-400">
                  Waiting for live feed sources...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
