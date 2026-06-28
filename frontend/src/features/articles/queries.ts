import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function useNewsFeed(category?: string | null) {
  return useInfiniteQuery({
    queryKey: ["news-feed", category],
    queryFn: ({ pageParam }) => api.getNews(pageParam as number, 8, category),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next_cursor) {
        return undefined;
      }
      return Number(lastPage.next_cursor);
    },
    retry: 0,
  });
}

export function useCriticalStories() {
  return useQuery({
    queryKey: ["critical-stories"],
    queryFn: api.getCritical,
  });
}

export function useFeedStatus() {
  return useQuery({
    queryKey: ["feed-status"],
    queryFn: async () => ({
      activeAlerts: 0,
      lastFetched: new Date().toISOString(),
    }),
  });
}

export function useTrendingTopics() {
  return useQuery({
    queryKey: ["trending-topics"],
    queryFn: api.getTrending,
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: () => api.getArticle(slug),
    enabled: Boolean(slug),
  });
}

export function useSearchNews(query: string) {
  return useQuery({
    queryKey: ["search-news", query],
    queryFn: () => api.searchNews(query),
    enabled: query.trim().length > 1,
  });
}
