import type { Article } from "@/lib/api";
import { DateLine } from "@/components/news/article-primitives";

export function PaperCard({ article }: { article: Article }) {
  return (
    <a
      href={article.canonical_url}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col border border-border bg-panel p-4 transition-colors hover:border-accent/30 dark:border-white/10"
    >
      <span className="w-fit rounded-full border border-accent/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
        {article.source.name}
      </span>
      <h3 className="mt-3 line-clamp-3 text-sm font-semibold leading-snug text-zinc-900 dark:text-white">
        {article.title}
      </h3>
      <p className="mt-2 line-clamp-4 text-xs leading-5 text-zinc-600 dark:text-slate-400">{article.excerpt}</p>
      <div className="mt-3 flex items-center justify-end font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-slate-500">
        <DateLine timestamp={article.published_at} />
      </div>
    </a>
  );
}
