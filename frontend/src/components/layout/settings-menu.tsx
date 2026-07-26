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
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 bg-white/80 text-slate-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-200"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[200px] overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-900/95">
          <div className="px-4 pt-2.5 text-sm text-slate-500 dark:text-slate-500">Settings</div>
          <ul>
            <li>
              <ThemeToggle />
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-accent/10 dark:text-slate-100"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
