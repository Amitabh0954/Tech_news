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

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-border bg-gradient-to-br dark:border-white/10",
        tone,
        compact ? "aspect-[4/3]" : "aspect-[4/3] lg:aspect-[16/11]",
        className,
      )}
    >
      {article.image_url ? (
        <img src={article.image_url} alt={article.title} className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_55%)] dark:bg-[linear-gradient(135deg,rgba(0,0,0,0.04),rgba(0,0,0,0.45)_75%)]" />
      <div className="absolute left-4 top-4 rounded-full border border-accent/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
        {article.category?.name ?? "Signal"}
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="max-w-[16rem] text-[11px] uppercase tracking-[0.24em] text-zinc-700 dark:text-slate-300">
          {article.source.name}
        </div>
        <div className="mt-2 max-w-[26rem] text-2xl font-semibold leading-tight tracking-[-0.04em] text-zinc-950 dark:text-white">
          {compact ? article.title.split(" ").slice(0, 5).join(" ") : article.title}
        </div>
      </div>
    </div>
  );
}
