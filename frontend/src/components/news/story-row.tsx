import { Link } from "react-router-dom";

import type { Article } from "@/lib/api";
import { ImpactBadge } from "@/components/ui/impact-badge";

export function StoryRow({ article }: { article: Article }) {
  return (
    <article className="grid gap-4 border-b border-border py-5 first:pt-0 last:border-b-0 dark:border-white/10 md:grid-cols-[180px_1fr]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">
        {article.category?.name ?? "Engineering"}
      </div>
      <Link to={`/app/article/${article.slug}`} className="block">
        <div className="mb-3 flex items-center gap-3">
          <ImpactBadge score={article.impact_score} urgency={article.urgency} />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-slate-500">
            {article.source.name}
          </span>
        </div>
        <h3 className="font-heading text-2xl font-semibold leading-[1.18] tracking-[-0.05em] text-zinc-900 dark:text-white">
          {article.title}
        </h3>
        <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-slate-300">
          {article.summary?.what_happened ?? article.excerpt}
        </p>
        {article.ecosystem_tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.ecosystem_tags.map((tag) => (
              <span key={tag} className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </Link>
    </article>
  );
}
