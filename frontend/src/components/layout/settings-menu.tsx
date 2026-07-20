import { useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";

/** Single "more" trigger that houses everything that isn't primary navigation —
    appearance and logout today, with room for future account/settings entries —
    instead of each control taking its own slot in the header. */
export function SettingsMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={open ? "Close settings" : "Open settings"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 bg-white/80 text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-200"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[200px] rounded-2xl border border-black/10 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-900/95">
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">
            Settings
          </div>
          <div className="flex flex-col gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/20"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
