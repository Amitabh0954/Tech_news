import { create } from "zustand";

type Theme = "dark" | "light";

type UIState = {
  theme: Theme;
  activeCategory: string | null;
  setTheme: (theme: Theme) => void;
  setActiveCategory: (category: string | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  theme: "light",
  activeCategory: null,
  setTheme: (theme) => set({ theme }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
}));
