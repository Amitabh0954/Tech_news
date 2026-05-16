import { useBookmarkStore } from "@/stores/bookmark-store";

export function BookmarkButton({ slug }: { slug: string }) {
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
  const isBookmarked = useBookmarkStore((state) => state.isBookmarked(slug));

  return (
    <button
      type="button"
      onClick={() => toggleBookmark(slug)}
      className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
        isBookmarked ? "border-accent/40 bg-accent/10 text-accent" : "border-white/10 text-slate-400"
      }`}
    >
      {isBookmarked ? "Saved" : "Save"}
    </button>
  );
}
