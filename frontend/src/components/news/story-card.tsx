import { Link } from "react-router-dom";

import type { Article } from "@/lib/api";
import { ImpactBadge } from "@/components/ui/impact-badge";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { TagPill } from "@/components/ui/tag-pill";

export function StoryCard({ article }: { article: Article }) {
  return (
    <article className="border border-border bg-panel p-5 transition-colors hover:border-accent/30 dark:border-white/10">
      <Link to={`/app/article/${article.slug}`} className="block">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ImpactBadge score={article.impact_score} urgency={article.urgency} />
            {article.category ? <TagPill label={article.category.name} /> : null}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-slate-500">{article.source.name}</div>
        </div>
        <h3 className="text-xl font-semibold leading-tight text-zinc-900 dark:text-white">{article.title}</h3>
        <p className="mt-3 text-sm leading-5 text-zinc-700 dark:text-slate-300">
          {article.summary?.what_happened ?? article.excerpt ?? "Summary pending."}
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
      <div className="mt-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-slate-500">
        <span>{new Date(article.published_at).toLocaleString()}</span>
        <div className="flex items-center gap-3">
          <BookmarkButton slug={article.slug} />
          <a href={article.canonical_url} target="_blank" rel="noreferrer" className="text-accent">
            Source
          </a>
        </div>
      </div>
    </article>
  );
}
