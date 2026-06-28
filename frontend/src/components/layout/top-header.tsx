import { Link } from "react-router-dom";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";

export function TopHeader() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-panel/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border border-accent/25 text-accent">
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
        <div className="flex items-center gap-4 lg:gap-8">
          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-800 md:flex dark:text-slate-200">
            <Link to="/">Top Stories</Link>
            <Link to="/critical">Security</Link>
            <Link to="/search">AI & Agents</Link>
            <Link to="/bookmarks">Cloud</Link>
            <Link to={isAuthenticated ? "/" : "/login"}>{isAuthenticated ? "Dashboard" : "Tooling"}</Link>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                className="hidden rounded-full border border-border px-5 py-3 text-sm font-semibold text-zinc-700 lg:inline-flex dark:border-white/10 dark:text-slate-200"
              >
                Log Out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full border border-border px-5 py-3 text-sm font-semibold text-zinc-700 lg:inline-flex dark:border-white/10 dark:text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="hidden rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white lg:inline-flex dark:bg-white dark:text-zinc-950"
                >
                  Register
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
