import { Link } from "react-router-dom";

import type { Article } from "@/lib/api";
import { EditorialPhoto } from "@/components/news/editorial-photo";
import { DateLine } from "@/components/news/article-primitives";
import { ImpactBadge } from "@/components/ui/impact-badge";
import { CardMenu } from "@/components/ui/card-menu";

export function FrontPageLead({ article }: { article: Article }) {
  const relatedTags = article.ecosystem_tags?.slice(0, 3) ?? [];

  return (
    <article className="space-y-5">
      {/* Category + related-topic strip sits above the headline (wire-style
          "Section > tag | tag | tag"), so the reader knows what they're about
          to read before committing to the headline — the image comes after. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-semibold text-heading dark:text-white">{article.category?.name ?? "Signal"}</span>
          {relatedTags.length ? <span className="text-slate-400 dark:text-slate-600">›</span> : null}
          {relatedTags.map((tag, index) => (
            <span key={tag} className="text-slate-600 dark:text-slate-400">
              {tag}
              {index < relatedTags.length - 1 ? <span className="mx-2 text-slate-300 dark:text-slate-700">|</span> : null}
            </span>
          ))}
        </div>
        <CardMenu articleId={article.id} />
      </div>
      <div className="space-y-3">
        <Link to={`/app/article/${article.slug}`} className="block">
          <h1 className="max-w-4xl font-heading text-4xl font-bold leading-[1.08] tracking-[-0.07em] text-heading transition-colors duration-200 hover:text-accent dark:text-white lg:text-6xl">
            {article.title}
          </h1>
        </Link>
        <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          {article.summary?.why_it_matters ?? article.excerpt}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ImpactBadge score={article.impact_score} urgency={article.urgency} />
          <span className="font-heading text-xs text-accent/70">
            {article.source.name} · <DateLine timestamp={article.published_at} />
          </span>
        </div>
      </div>
      <Link to={`/app/article/${article.slug}`} className="group block">
        <EditorialPhoto article={article} />
      </Link>
      {article.summary?.what_happened ? (
        <p className="max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-400">{article.summary.what_happened}</p>
      ) : null}
    </article>
  );
}
