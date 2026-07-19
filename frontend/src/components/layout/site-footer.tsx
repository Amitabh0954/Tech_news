import { Link } from "react-router-dom";

// No external social accounts exist for this project yet, so these circular
// icon buttons point at in-app destinations instead of fabricated profile URLs —
// same visual treatment (outlined circle, accent color) as a wire site's social row.
const FOOTER_ICON_LINKS: { label: string; to: string; icon: JSX.Element }[] = [
  {
    label: "Search",
    to: "/app/search",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6" />
        <path d="M20 20l-4.2-4.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Latest signal (RSS-style feed)",
    to: "/app/latest",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 5c7.732 0 14 6.268 14 14M5 11c4.418 0 8 3.582 8 8" strokeLinecap="round" />
        <circle cx="6" cy="18" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Saved stories",
    to: "/app/bookmarks",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 4h10v16l-5-3.5L7 20V4Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Repos",
    to: "/app/repos",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 6 3 12l6 6M15 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const FOOTER_LINK_GROUPS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: "Browse",
    links: [
      { label: "Top Stories", to: "/app" },
      { label: "Latest", to: "/app/latest" },
      { label: "Critical Alerts", to: "/app/critical" },
    ],
  },
  {
    heading: "Signal",
    links: [
      { label: "Papers", to: "/app/papers" },
      { label: "Repos", to: "/app/repos" },
      { label: "Saved", to: "/app/bookmarks" },
    ],
  },
  {
    heading: "Filters",
    links: [
      { label: "Security", to: "/app?category=security" },
      { label: "AI", to: "/app?category=ai" },
      { label: "Search", to: "/app/search" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-panel dark:border-white/10">
      <div className="mx-auto max-w-[1600px] px-4 py-10 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="font-heading text-xl font-semibold tracking-[-0.05em] text-zinc-900 dark:text-white">
              EngIntel
            </div>
            <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-600 dark:text-slate-400">
              High-signal engineering coverage — AI, security, cloud, and the tooling shifts that shape how teams
              ship.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {FOOTER_ICON_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  title={item.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-accent/40 text-accent transition-colors hover:bg-accent/10"
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>
          {FOOTER_LINK_GROUPS.map((group) => (
            <div key={group.heading}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">
                {group.heading}
              </div>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-zinc-700 hover:text-accent dark:text-slate-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-zinc-500 dark:border-white/10 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} EngIntel. Engineering wire, aggregated.</span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-left font-medium text-zinc-600 hover:text-accent dark:text-slate-400"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
