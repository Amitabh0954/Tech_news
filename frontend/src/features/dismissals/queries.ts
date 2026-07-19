import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const DISMISSALS_KEY = ["dismissals"];

export function useDismissedIds() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: DISMISSALS_KEY,
    queryFn: api.getDismissals,
    enabled: Boolean(token),
    staleTime: 1000 * 60,
  });
}

export function useDismissArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => api.dismissArticle(articleId),
    onSuccess: () => {
      // The feed queries themselves don't need to be invalidated — every card-rendering
      // surface filters its items against useDismissedIds(), so refreshing just this key
      // is enough for the dismissed story to disappear on the next render.
      queryClient.invalidateQueries({ queryKey: DISMISSALS_KEY });
    },
  });
}
