import type { Article } from "@/lib/api";
import { StoryCard } from "@/components/news/story-card";

export function NewsSection({
  title,
  items,
}: {
  title: string;
  items: Article[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3 dark:border-white/10">
        <h2 className="text-sm uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-400">{title}</h2>
        <div className="text-xs font-mono text-zinc-500 dark:text-slate-500">{items.length} stories</div>
      </div>
      <div className="grid gap-4">
        {items.map((article) => (
          <StoryCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
