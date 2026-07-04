import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const BOOKMARKS_KEY = ["bookmarks"];

export function useBookmarks() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: BOOKMARKS_KEY,
    queryFn: api.getBookmarks,
    enabled: Boolean(token),
    staleTime: 1000 * 60,
  });
}

export function useIsBookmarked(articleId: string) {
  const { data } = useBookmarks();
  return Boolean(data?.some((article) => article.id === articleId));
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, isBookmarked }: { articleId: string; isBookmarked: boolean }) =>
      isBookmarked ? api.removeBookmark(articleId) : api.addBookmark(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKMARKS_KEY });
    },
  });
}
