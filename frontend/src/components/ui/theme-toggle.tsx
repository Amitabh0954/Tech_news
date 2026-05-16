import { useEffect } from "react";

import { useUIStore } from "@/stores/ui-store";

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <button
      className="rounded-full border border-border bg-panel px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-zinc-700 dark:border-white/10 dark:text-slate-300"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      type="button"
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
