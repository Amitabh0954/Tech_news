import { create } from "zustand";

type BookmarkState = {
  savedSlugs: string[];
  toggleBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
};

const STORAGE_KEY = "engintel-bookmarks";

function readInitialState(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value ? JSON.parse(value) : [];
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  savedSlugs: readInitialState(),
  toggleBookmark: (slug) =>
    set((state) => {
      const savedSlugs = state.savedSlugs.includes(slug)
        ? state.savedSlugs.filter((item) => item !== slug)
        : [...state.savedSlugs, slug];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSlugs));
      }
      return { savedSlugs };
    }),
  isBookmarked: (slug) => get().savedSlugs.includes(slug),
}));
