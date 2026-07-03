import type { Article } from "@/lib/api";
import { cn } from "@/lib/utils";

const categoryThemes: Record<string, string> = {
  ai: "from-amber-100 via-white to-orange-100 dark:from-amber-950/30 dark:via-zinc-900 dark:to-orange-950/30",
  security: "from-rose-100 via-white to-red-100 dark:from-rose-950/30 dark:via-zinc-900 dark:to-red-950/30",
  cloud: "from-sky-100 via-white to-cyan-100 dark:from-sky-950/30 dark:via-zinc-900 dark:to-cyan-950/30",
  oss: "from-emerald-100 via-white to-lime-100 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-lime-950/30",
  tooling: "from-violet-100 via-white to-fuchsia-100 dark:from-violet-950/30 dark:via-zinc-900 dark:to-fuchsia-950/30",
  research: "from-stone-100 via-white to-zinc-100 dark:from-stone-900 dark:via-zinc-900 dark:to-neutral-900",
};

export function EditorialPhoto({
  article,
  className,
  compact = false,
}: {
  article: Article;
  className?: string;
  compact?: boolean;
}) {
  const categorySlug = article.category?.slug ?? "research";
  const tone = categoryThemes[categorySlug] ?? categoryThemes.research;
  const hasImage = Boolean(article.image_url?.trim());

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-border bg-gradient-to-br dark:border-white/10",
        tone,
        hasImage ? (compact ? "aspect-[4/3]" : "aspect-[4/3] lg:aspect-[16/11]") : compact ? "rounded-3xl bg-white/90 p-5 shadow-sm dark:bg-zinc-950/90" : "rounded-3xl bg-white/95 p-6 shadow-sm dark:bg-zinc-950/95",
        className,
      )}
    >
      {hasImage ? (
        <>
          <img src={article.image_url ?? ""} alt={article.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_55%)] dark:bg-[linear-gradient(135deg,rgba(0,0,0,0.04),rgba(0,0,0,0.45)_75%)]" />
        </>
      ) : null}
      <div className="absolute left-4 top-4 rounded-full border border-accent/25 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent backdrop-blur dark:border-white/10 dark:bg-zinc-900/70">
        {article.category?.name ?? "Signal"}
      </div>
      <div className={cn("absolute left-4 right-4", hasImage ? "bottom-4" : "relative mt-3") }>
        {hasImage ? (
          <div className="max-w-[16rem] text-[11px] uppercase tracking-[0.24em] text-zinc-700 dark:text-slate-300">
            {article.source.name}
          </div>
        ) : null}
        <div
          className={cn(
            "mt-2 text-2xl font-semibold leading-tight tracking-[-0.04em] text-zinc-950 dark:text-white",
            hasImage ? "max-w-[26rem]" : "text-xl lg:text-2xl",
          )}
        >
          {compact ? article.title.split(" ").slice(0, 5).join(" ") : article.title}
        </div>
      </div>
    </div>
  );
}
