import type { Article } from "@/lib/api";
import { cn } from "@/lib/utils";

const categoryThemes: Record<string, string> = {
  ai: "from-amber-100 via-white to-orange-100 dark:from-amber-950/30 dark:via-zinc-900 dark:to-orange-950/30",
  security: "from-rose-100 via-white to-red-100 dark:from-rose-950/30 dark:via-zinc-900 dark:to-red-950/30",
  cloud: "from-sky-100 via-white to-cyan-100 dark:from-sky-950/30 dark:via-zinc-900 dark:to-cyan-950/30",
  oss: "from-emerald-100 via-white to-lime-100 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-lime-950/30",
  tooling: "from-violet-100 via-white to-fuchsia-100 dark:from-violet-950/30 dark:via-zinc-900 dark:to-fuchsia-950/30",
  research: "from-stone-100 via-white to-zinc-100 dark:from-stone-900 dark:via-zinc-900 dark:to-neutral-900",
  infra: "from-teal-100 via-white to-emerald-100 dark:from-teal-950/30 dark:via-zinc-900 dark:to-emerald-950/30",
  "supply-chain": "from-orange-100 via-white to-red-100 dark:from-orange-950/30 dark:via-zinc-900 dark:to-red-950/30",
  mobile: "from-indigo-100 via-white to-purple-100 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-purple-950/30",
  databases: "from-blue-100 via-white to-slate-100 dark:from-blue-950/30 dark:via-zinc-900 dark:to-slate-950/30",
  "web-frontend": "from-pink-100 via-white to-rose-100 dark:from-pink-950/30 dark:via-zinc-900 dark:to-rose-950/30",
  "data-engineering": "from-lime-100 via-white to-green-100 dark:from-lime-950/30 dark:via-zinc-900 dark:to-green-950/30",
};

export function EditorialPhoto({
  article,
  className,
  aspect = "wide",
}: {
  article: Article;
  className?: string;
  /** "wide" mirrors a wire homepage's lead banner (panoramic on large screens);
      "grid" is a slightly taller 16:9 used for the river's card grid; "square" is
      the bigger, squared-off thumbnail used in side-rail lists (Reuters-style). */
  aspect?: "wide" | "grid" | "square";
}) {
  const categorySlug = article.category?.slug ?? "research";
  const tone = categoryThemes[categorySlug] ?? categoryThemes.research;
  const hasImage = Boolean(article.image_url?.trim());
  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "grid" ? "aspect-[16/9]" : "aspect-[16/9] lg:aspect-[21/9]";

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-border bg-gradient-to-br dark:border-white/10",
        tone,
        hasImage ? aspectClass : "rounded-3xl bg-white/95 p-6 shadow-sm dark:bg-zinc-950/95",
        className,
      )}
    >
      {hasImage ? (
        <img
          src={article.image_url ?? ""}
          alt={article.title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <div className="absolute left-4 top-4 rounded-full border border-accent/25 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent backdrop-blur dark:border-white/10 dark:bg-zinc-900/70">
        {article.category?.name ?? "Signal"}
      </div>
      {/* Title/source are rendered by the calling card (FrontPageLead/StoryTile)
          outside this component. Overlaying them again here on top of a real photo produced
          duplicated text with poor contrast against busy images — only show it for the
          no-image gradient-card treatment, where this text is the card's only content. */}
      {!hasImage ? (
        <div className="relative mx-4 mt-3 text-xl font-semibold leading-tight tracking-[-0.04em] text-zinc-950 dark:text-white lg:text-2xl">
          {article.title}
        </div>
      ) : null}
    </div>
  );
}
