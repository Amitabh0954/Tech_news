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
    <article className="space-y-3 border-b border-border pb-6 last:border-b-0 dark:border-white/10">
      <Link to={`/app/article/${article.slug}`} className="block">
        {/* Square crop instead of a wide banner ratio — this column is narrow, so a
            landscape crop here zoomed in hard on real photos. Square crops much less
            aggressively at this width while still reading as a proper photo, not a tiny icon. */}
        <EditorialPhoto article={article} compact />
      </Link>
      <div className="min-w-0 space-y-2">
        <div className="text-sm text-zinc-600 dark:text-slate-400">{eyebrow ?? article.category?.name ?? "Top story"}</div>
        <Link to={`/app/article/${article.slug}`} className="block">
          <h2 className="font-heading text-[2rem] font-semibold leading-[1.15] tracking-[-0.06em] text-zinc-900 dark:text-white">
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
