import { Link, NavLink, useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCategories } from "@/features/filters/queries";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

const pageNavItems = [
  { to: "/app", label: "Top Stories" },
  { to: "/app/critical", label: "Critical" },
  { to: "/app/bookmarks", label: "Saved" },
  { to: "/app/architecture", label: "Architecture" },
];

// Only the highest-traffic categories get a direct shortcut in the header;
// the full category list always lives in the home page sidebar filter.
const FEATURED_CATEGORY_SLUGS = ["security", "ai"];

export function TopHeader() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { setActiveCategory } = useUIStore();
  const { data: categories } = useCategories();

  const featuredCategories = FEATURED_CATEGORY_SLUGS.map((slug) => categories?.find((category) => category.slug === slug)).filter(
    (category): category is NonNullable<typeof category> => Boolean(category),
  );

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug);
    navigate("/app");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link to="/app" className="flex items-center gap-3">
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
            <NavLink
              to="/app"
              end
              className={({ isActive }) =>
                `rounded-full px-3 py-2 transition-all duration-200 hover:bg-accent/10 hover:text-accent ${
                  isActive ? "bg-accent/10 text-accent" : ""
                }`
              }
            >
              Top Stories
            </NavLink>
            {featuredCategories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => handleCategoryClick(category.slug)}
                className="rounded-full px-3 py-2 transition-all duration-200 hover:bg-accent/10 hover:text-accent"
              >
                {category.name}
              </button>
            ))}
            {pageNavItems.slice(1).map((item) => (
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
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:border-rose-500/50 dark:hover:bg-rose-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
