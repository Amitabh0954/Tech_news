import { Link } from "react-router-dom";

import type { Article } from "@/lib/api";
import { EditorialPhoto } from "@/components/news/editorial-photo";
import { DateLine } from "@/components/news/article-primitives";
import { ImpactBadge } from "@/components/ui/impact-badge";
import { CardMenu } from "@/components/ui/card-menu";
import { cn } from "@/lib/utils";

/** Image-first grid tile for the "Top Engineering Stories" river — mirrors a wire
    homepage's "More Top Stories" rail (photo, headline, byline) instead of the dense
    text-only row list, which reads better once there are more than a handful of items. */
export function StoryTile({
  article,
  imageAspect = "grid",
}: {
  article: Article;
  /** "grid" (default) is the card-grid thumbnail; "square" is the larger,
      squared-off thumbnail used in side-rail lists (home page right rail, article
      page sidebar) — inspired by Reuters' side rail. */
  imageAspect?: "wide" | "grid" | "square";
}) {
  return (
    <Link to={`/app/article/${article.slug}`} className="group relative block">
      <CardMenu articleId={article.id} className="absolute right-2 top-2 z-10" />
      <EditorialPhoto article={article} aspect={imageAspect} />
      <div className="mt-3 space-y-2">
        <div className="font-heading text-xs font-semibold text-slate-500 dark:text-slate-500">
          {article.category?.name ?? "Engineering"}
        </div>
        <h3
          className={cn(
            "font-heading font-bold leading-[1.25] tracking-[-0.03em] text-heading transition-colors duration-200 group-hover:text-accent dark:text-white",
            imageAspect === "square" ? "text-xl" : "text-lg",
          )}
        >
          {article.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <ImpactBadge score={article.impact_score} urgency={article.urgency} />
          <span className="font-heading text-xs text-slate-500 dark:text-slate-500">
            {article.source.name} · <DateLine timestamp={article.published_at} />
          </span>
        </div>
      </div>
    </Link>
  );
}
