import { Link } from "react-router-dom";

import type { Article } from "@/lib/api";
import { ImpactBadge } from "@/components/ui/impact-badge";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { CardMenu } from "@/components/ui/card-menu";
import { TagPill } from "@/components/ui/tag-pill";
import { DateLine } from "@/components/news/article-primitives";

export function StoryCard({ article }: { article: Article }) {
  return (
    <article className="rounded-[var(--card-radius)] border border-border bg-panel p-5 shadow-[var(--card-shadow)] transition-all duration-200 hover:translate-y-[var(--card-lift)] hover:border-accent/30 hover:shadow-[var(--card-shadow-hover)] dark:border-white/10">
      <Link to={`/app/article/${article.slug}`} className="block">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ImpactBadge score={article.impact_score} urgency={article.urgency} />
            {article.category ? <TagPill label={article.category.name} slug={article.category.slug} /> : null}
          </div>
          <div className="flex items-center gap-2">
            <div className="font-heading text-xs text-slate-500 dark:text-slate-500">{article.source.name}</div>
            <CardMenu articleId={article.id} />
          </div>
        </div>
        <h3 className="text-xl font-bold leading-tight tracking-tight text-heading dark:text-white">{article.title}</h3>
        <p className="mt-3 text-sm leading-5 text-slate-600 dark:text-slate-300">
          {article.summary?.what_happened ?? article.excerpt ?? "Summary pending."}
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
      <div className="mt-4 flex items-center justify-between font-heading text-xs text-muted-2 dark:text-slate-500">
        <DateLine timestamp={article.published_at} />
        <div className="flex items-center gap-3">
          <BookmarkButton articleId={article.id} />
          <a href={article.canonical_url} target="_blank" rel="noreferrer" className="text-accent transition-colors hover:text-accent-hover">
            Source
          </a>
        </div>
      </div>
    </article>
  );
}
