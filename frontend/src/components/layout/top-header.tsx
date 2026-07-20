import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";

import logoIcon from "@/assets/logo-icon.png";
import logoIconLight from "@/assets/logo-icon-light.png";
import { SettingsMenu } from "@/components/layout/settings-menu";
import { useCategories } from "@/features/filters/queries";
import { useSearchSuggestions } from "@/features/articles/queries";
import { DATE_FILTER_OPTIONS } from "@/lib/date-filters";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

const pageNavItems = [
  { to: "/app", label: "Top Stories" },
  { to: "/app/latest", label: "Latest" },
  { to: "/app/critical", label: "Critical" },
  { to: "/app/bookmarks", label: "Saved" },
  { to: "/app/papers", label: "Papers" },
  { to: "/app/repos", label: "Repos" },
];

// Only the highest-traffic category gets a direct shortcut in the header;
// the rest (including AI) are reachable through the "Topic" dropdown next to it.
const FEATURED_CATEGORY_SLUGS = ["security"];

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
        Topic
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

function DateDropdown({ activeDays, onSelect }: { activeDays: number | null; onSelect: (days: number | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeLabel = DATE_FILTER_OPTIONS.find((option) => option.days === activeDays)?.label ?? "Date";

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
          isOpen || activeDays ? "bg-accent/10 text-accent" : "text-zinc-700 dark:text-slate-200"
        }`}
      >
        {activeDays ? activeLabel : "Date"}
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[160px] overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-900/95">
          <ul>
            {DATE_FILTER_OPTIONS.map((option) => (
              <li key={option.label}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(option.days);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-accent/10 ${
                    activeDays === option.days ? "text-accent" : "text-zinc-800 dark:text-slate-100"
                  }`}
                >
                  {option.label}
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
      className="relative min-w-[140px] max-w-[320px] flex-1 sm:min-w-[220px]"
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
  const [searchParams] = useSearchParams();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { activeCategory, activeDays, setActiveCategory, setActiveDays } = useUIStore();
  const { data: categories } = useCategories();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const featuredCategories = FEATURED_CATEGORY_SLUGS.map((slug) => categories?.find((category) => category.slug === slug)).filter(
    (category): category is NonNullable<typeof category> => Boolean(category),
  );

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  // Category and date filters both live in /app's query string, so changing one has
  // to preserve whatever the other is currently set to instead of clobbering it.
  const navigateWithFilters = (updates: { category?: string | null; days?: number | null }) => {
    const next = new URLSearchParams(searchParams);
    if ("category" in updates) {
      if (updates.category) next.set("category", updates.category);
      else next.delete("category");
    }
    if ("days" in updates) {
      if (updates.days) next.set("days", String(updates.days));
      else next.delete("days");
    }
    const qs = next.toString();
    navigate(qs ? `/app?${qs}` : "/app");
  };

  const handleCategoryClick = (slug: string | null) => {
    setActiveCategory(slug);
    setIsMobileMenuOpen(false);
    navigateWithFilters({ category: slug });
  };

  const handleDateClick = (days: number | null) => {
    setActiveDays(days);
    setIsMobileMenuOpen(false);
    navigateWithFilters({ days });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link to="/app" className="flex items-center gap-3">
          <img src={logoIconLight} alt="" className="block h-10 w-10 shrink-0 dark:hidden" />
          <img src={logoIcon} alt="" className="hidden h-10 w-10 shrink-0 dark:block" />
          <div>
            <div className="font-heading text-2xl font-semibold tracking-[-0.05em] text-zinc-900 dark:text-white sm:text-[2rem]">
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
              onClick={() => {
                setActiveCategory(null);
                setActiveDays(null);
              }}
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
            <DateDropdown activeDays={activeDays} onSelect={handleDateClick} />
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
            <SettingsMenu onLogout={handleLogout} />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 bg-white/80 text-zinc-700 dark:border-white/10 dark:bg-zinc-900/70 dark:text-slate-200 md:hidden"
            >
              {isMobileMenuOpen ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <nav className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-black/10 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 md:hidden">
          <div className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-slate-200">
            <NavLink
              to="/app"
              end
              onClick={() => {
                setActiveCategory(null);
                setActiveDays(null);
                setIsMobileMenuOpen(false);
              }}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2.5 transition-colors ${
                  isActive && !activeCategory ? "bg-accent/10 text-accent" : "hover:bg-accent/10"
                }`
              }
            >
              Top Stories
            </NavLink>
            {pageNavItems.slice(1).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2.5 transition-colors ${isActive ? "bg-accent/10 text-accent" : "hover:bg-accent/10"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">
              Categories
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleCategoryClick(null)}
                className={`rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  activeCategory === null ? "bg-accent/10 text-accent" : "text-zinc-700 hover:bg-accent/10 dark:text-slate-200"
                }`}
              >
                All signal
              </button>
              {categories?.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryClick(category.slug)}
                  className={`rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    activeCategory === category.slug
                      ? "bg-accent/10 text-accent"
                      : "text-zinc-700 hover:bg-accent/10 dark:text-slate-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">
              Date
            </div>
            <div className="flex flex-col gap-1">
              {DATE_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleDateClick(option.days)}
                  className={`rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    activeDays === option.days ? "bg-accent/10 text-accent" : "text-zinc-700 hover:bg-accent/10 dark:text-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
