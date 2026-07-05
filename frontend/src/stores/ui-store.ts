import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

type UIState = {
  theme: Theme;
  // Not persisted here: the category filter lives in the URL (see HomeRoute) so
  // browser back/forward and shareable links work; this field just mirrors it
  // for components (header, sidebar) that need to highlight the active filter.
  activeCategory: string | null;
  setTheme: (theme: Theme) => void;
  setActiveCategory: (category: string | null) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      activeCategory: null,
      setTheme: (theme) => set({ theme }),
      setActiveCategory: (activeCategory) => set({ activeCategory }),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
