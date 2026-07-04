import { Link } from "react-router-dom";

import type { Article } from "@/lib/api";
import { EditorialPhoto } from "@/components/news/editorial-photo";
import { DateLine } from "@/components/news/article-primitives";

export function FrontPageSecondary({
  article,
  eyebrow,
}: {
  article: Article;
  eyebrow?: string;
}) {
  return (
    <article className="flex gap-4 border-b border-border pb-6 last:border-b-0 dark:border-white/10">
      <Link to={`/app/article/${article.slug}`} className="block shrink-0">
        {/* Fixed small square instead of a full-width banner crop — this column is
            narrow, so a landscape banner image forced object-cover here zoomed in
            hard on real photos and made them look distorted. A small thumbnail
            crops the same way but at a size where it reads as intentional. */}
        <EditorialPhoto article={article} compact className="h-24 w-24 shrink-0 rounded-2xl sm:h-28 sm:w-28" />
      </Link>
      <div className="min-w-0 space-y-2">
        <div className="text-sm text-zinc-600 dark:text-slate-400">{eyebrow ?? article.category?.name ?? "Top story"}</div>
        <Link to={`/app/article/${article.slug}`} className="block">
          <h2 className="font-heading text-xl font-semibold leading-[1.15] tracking-[-0.05em] text-zinc-900 dark:text-white">
            {article.title}
          </h2>
        </Link>
        <div className="text-sm text-zinc-500 dark:text-slate-500">
          <DateLine timestamp={article.published_at} />
        </div>
      </div>
    </article>
  );
}
