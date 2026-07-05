import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCategories } from "@/features/filters/queries";
import { useSearchSuggestions } from "@/features/articles/queries";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

const pageNavItems = [
  { to: "/app", label: "Top Stories" },
  { to: "/app/critical", label: "Critical" },
  { to: "/app/bookmarks", label: "Saved" },
  { to: "/app/architecture", label: "Architecture" },
];

// Only the highest-traffic categories get a direct shortcut in the header;
// the rest are reachable through the "Filters" dropdown next to them.
const FEATURED_CATEGORY_SLUGS = ["security", "ai"];

function FilterDropdown({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: { id: string; name: string; slug: string }[];
  activeCategory: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent/10 hover:text-accent ${
          isOpen ? "bg-accent/10 text-accent" : "text-zinc-700 dark:text-slate-200"
        }`}
      >
        Filters
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[200px] overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-900/95">
          <ul>
            <li>
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-accent/10 ${
                  activeCategory === null ? "text-accent" : "text-zinc-800 dark:text-slate-100"
                }`}
              >
                All signal
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(category.slug);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-accent/10 ${
                    activeCategory === category.slug ? "text-accent" : "text-zinc-800 dark:text-slate-100"
                  }`}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SearchBar() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input), 250);
    return () => clearTimeout(timer);
  }, [input]);

  const { data: suggestions, isLoading } = useSearchSuggestions(debounced);
  const showDropdown = isOpen && input.trim().length > 1;

  const goToSearch = (query: string) => {
    setIsOpen(false);
    navigate(`/app/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div
      className="relative min-w-[220px] max-w-[320px] flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (input.trim().length > 1) {
            goToSearch(input.trim());
          }
        }}
      >
        <label className="flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2.5 text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-300">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-zinc-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6" />
            <path d="M20 20l-4.2-4.2" />
          </svg>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsOpen(false);
                event.currentTarget.blur();
              }
            }}
            placeholder="Search signals"
            className="w-full bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-slate-500"
          />
        </label>
      </form>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-900/95">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-slate-400">Searching…</div>
          ) : suggestions?.length ? (
            <ul>
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setInput(suggestion.title);
                      navigate(`/app/article/${suggestion.slug}`);
                    }}
                    className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left text-sm hover:bg-accent/10"
                  >
                    <span className="truncate text-zinc-800 dark:text-slate-100">{suggestion.title}</span>
                    {suggestion.category ? (
                      <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:text-slate-500">
                        {suggestion.category.name}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
              <li className="border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => goToSearch(input.trim())}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-accent hover:bg-accent/10"
                >
                  See all results for &ldquo;{input.trim()}&rdquo;
                </button>
              </li>
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-slate-400">No matches yet</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function TopHeader() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { activeCategory, setActiveCategory } = useUIStore();
  const { data: categories } = useCategories();

  const featuredCategories = FEATURED_CATEGORY_SLUGS.map((slug) => categories?.find((category) => category.slug === slug)).filter(
    (category): category is NonNullable<typeof category> => Boolean(category),
  );

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const handleCategoryClick = (slug: string | null) => {
    setActiveCategory(slug);
    navigate(slug ? `/app?category=${encodeURIComponent(slug)}` : "/app");
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
          <SearchBar />

          <nav className="hidden items-center gap-2 text-sm font-medium text-zinc-700 md:flex dark:text-slate-200">
            <NavLink
              to="/app"
              end
              onClick={() => setActiveCategory(null)}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 transition-all duration-200 hover:bg-accent/10 hover:text-accent ${
                  isActive && !activeCategory ? "bg-accent/10 text-accent" : ""
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
                className={`rounded-full px-3 py-2 transition-all duration-200 hover:bg-accent/10 hover:text-accent ${
                  activeCategory === category.slug ? "bg-accent/10 text-accent" : ""
                }`}
              >
                {category.name}
              </button>
            ))}
            <FilterDropdown
              categories={(categories ?? []).filter((category) => !FEATURED_CATEGORY_SLUGS.includes(category.slug))}
              activeCategory={activeCategory}
              onSelect={handleCategoryClick}
            />
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
