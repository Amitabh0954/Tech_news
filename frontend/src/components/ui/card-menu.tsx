import { useEffect, useRef, useState } from "react";

import { useDismissArticle } from "@/features/dismissals/queries";
import { cn } from "@/lib/utils";

/** Three-dot overflow menu shown on every story card. Every card that uses this is
    wrapped in a react-router <Link>, so opening the menu and firing its action both
    need preventDefault/stopPropagation — same convention as BookmarkButton/ShareButton. */
export function CardMenu({ articleId, className }: { articleId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dismissArticle = useDismissArticle();

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-label="More options"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="grid h-7 w-7 place-items-center rounded-full border border-border bg-white/80 text-zinc-500 backdrop-blur transition-colors hover:border-accent/40 hover:text-accent dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-400"
      >
        <span className="-mt-1 text-base leading-none tracking-[0.1em]">&#8943;</span>
      </button>
      {open ? (
        <div
          className="absolute right-0 top-8 z-10 min-w-[160px] rounded-lg border border-border bg-white py-1 shadow-lg dark:border-white/10 dark:bg-zinc-900"
          onClick={(event) => event.preventDefault()}
        >
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dismissArticle.mutate(articleId);
              setOpen(false);
            }}
            disabled={dismissArticle.isPending}
            className="block w-full px-3 py-2 text-left text-xs uppercase tracking-[0.12em] text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-white/5"
          >
            Don&apos;t show again
          </button>
        </div>
      ) : null}
    </div>
  );
}
