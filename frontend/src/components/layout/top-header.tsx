import { Link, NavLink } from "react-router-dom";

import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { to: "/", label: "Top Stories" },
  { to: "/critical", label: "Security" },
  { to: "/search", label: "AI & Agents" },
  { to: "/bookmarks", label: "Cloud" },
  { to: "/architecture", label: "Architecture" },
];

export function TopHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border border-accent/25 bg-white/70 text-accent shadow-sm dark:bg-zinc-900/70">
            <div className="h-5 w-5 rounded-full border-4 border-dotted border-accent" />
          </div>
          <div>
            <div className="font-heading text-[2rem] font-semibold tracking-[-0.05em] text-zinc-900 dark:text-white">
              EngIntel
            </div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">
              Engineering wire
            </div>
          </div>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3 lg:gap-4">
          <label className="flex min-w-[220px] max-w-[320px] flex-1 items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2.5 text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-zinc-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="6" />
              <path d="M20 20l-4.2-4.2" />
            </svg>
            <input
              type="text"
              placeholder="Search signals"
              className="w-full bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-slate-500"
            />
          </label>

          <nav className="hidden items-center gap-2 text-sm font-medium text-zinc-700 md:flex dark:text-slate-200">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 transition-all duration-200 hover:bg-accent/10 hover:text-accent ${
                    isActive ? "bg-accent/10 text-accent" : ""
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
