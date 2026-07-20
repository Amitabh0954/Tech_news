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
      className="w-full rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/20"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      type="button"
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
