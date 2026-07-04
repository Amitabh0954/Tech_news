import { useIsBookmarked, useToggleBookmark } from "@/features/bookmarks/queries";

export function BookmarkButton({ articleId }: { articleId: string }) {
  const isBookmarked = useIsBookmarked(articleId);
  const toggleBookmark = useToggleBookmark();

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleBookmark.mutate({ articleId, isBookmarked });
      }}
      disabled={toggleBookmark.isPending}
      className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors disabled:opacity-60 ${
        isBookmarked
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border text-zinc-500 dark:border-white/10 dark:text-slate-400"
      }`}
    >
      {isBookmarked ? "Saved" : "Save"}
    </button>
  );
}
