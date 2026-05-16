import { Link } from "react-router-dom";

import type { Article } from "@/lib/api";
import { EditorialPhoto } from "@/components/news/editorial-photo";
import { ImpactBadge } from "@/components/ui/impact-badge";

export function FrontPageLead({ article }: { article: Article }) {
  return (
    <article className="space-y-5">
      <Link to={`/article/${article.slug}`} className="block">
        <EditorialPhoto article={article} />
      </Link>
      <div className="space-y-3">
        <ImpactBadge score={article.impact_score} urgency={article.urgency} />
        <Link to={`/article/${article.slug}`} className="block">
          <h1 className="max-w-4xl font-heading text-4xl font-semibold leading-[1.08] tracking-[-0.07em] text-zinc-900 dark:text-white lg:text-6xl">
            {article.title}
          </h1>
        </Link>
        <p className="max-w-3xl text-lg leading-8 text-zinc-700 dark:text-slate-300">
          {article.summary?.why_it_matters ?? article.excerpt}
        </p>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-slate-500">
          {article.urgency} {article.impact_score.toFixed(1)} · {article.source.name} · {new Date(article.published_at).toLocaleString()}
        </div>
        {article.ecosystem_tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {article.ecosystem_tags.map((tag) => (
              <span key={tag} className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
