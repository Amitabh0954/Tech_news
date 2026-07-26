import { Link } from "react-router-dom";

import type { Article } from "@/lib/api";
import { ImpactBadge } from "@/components/ui/impact-badge";
import { CardMenu } from "@/components/ui/card-menu";
import { DateLine } from "@/components/news/article-primitives";

export function StoryRow({ article }: { article: Article }) {
  return (
    <article
      className="group grid gap-4 border-b border-transparent py-5 first:pt-0 last:border-b-0 md:grid-cols-[180px_1fr]"
      style={{ borderImage: "linear-gradient(to right, transparent, rgb(var(--accent) / 0.5), transparent) 1" }}
    >
      <div className="font-heading text-xs font-semibold text-slate-500 dark:text-slate-500">
        {article.category?.name ?? "Engineering"}
      </div>
      <Link to={`/app/article/${article.slug}`} className="block">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ImpactBadge score={article.impact_score} urgency={article.urgency} />
            <span className="font-heading text-xs text-slate-500 dark:text-slate-500">{article.source.name}</span>
            <span className="font-heading text-xs text-slate-500 dark:text-slate-500">
              <DateLine timestamp={article.published_at} />
            </span>
          </div>
          <CardMenu articleId={article.id} />
        </div>
        <h3 className="font-heading text-2xl font-bold leading-[1.18] tracking-[-0.05em] text-heading transition-colors duration-200 group-hover:text-accent dark:text-white">
          {article.title}
        </h3>
        <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
          {article.summary?.what_happened ?? article.excerpt}
        </p>
        {article.ecosystem_tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.ecosystem_tags.map((tag) => (
              <span key={tag} className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-2 dark:text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </Link>
    </article>
  );
}
