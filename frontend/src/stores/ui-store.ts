import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

type UIState = {
  theme: Theme;
  // Not persisted here: the category/date filters live in the URL (see HomeRoute) so
  // browser back/forward and shareable links work; these fields just mirror them
  // for components (header, sidebar) that need to highlight the active filter.
  activeCategory: string | null;
  activeDays: number | null;
  setTheme: (theme: Theme) => void;
  setActiveCategory: (category: string | null) => void;
  setActiveDays: (days: number | null) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      activeCategory: null,
      activeDays: null,
      setTheme: (theme) => set({ theme }),
      setActiveCategory: (activeCategory) => set({ activeCategory }),
      setActiveDays: (activeDays) => set({ activeDays }),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
