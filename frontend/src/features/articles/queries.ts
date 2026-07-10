import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function useNewsFeed(category?: string | null) {
  return useInfiniteQuery({
    queryKey: ["news-feed", category],
    queryFn: ({ pageParam }) => api.getNews(pageParam as number, 8, category),
    initialPageParam: 1,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next_cursor) {
        return undefined;
      }
      return Number(lastPage.next_cursor);
    },
    retry: 0,
  });
}

// Dedicated "Latest" feed: same endpoint as useNewsFeed (the API already returns
// newest-first), but polled much more aggressively so freshly ingested stories show
// up without a manual refresh.
export function useLatestNews() {
  return useInfiniteQuery({
    queryKey: ["latest-feed"],
    queryFn: ({ pageParam }) => api.getNews(pageParam as number, 12, null),
    initialPageParam: 1,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 20,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next_cursor) {
        return undefined;
      }
      return Number(lastPage.next_cursor);
    },
    retry: 0,
  });
}

export function usePapersFeed() {
  return useInfiniteQuery({
    queryKey: ["news-feed", "source-type", "paper"],
    queryFn: ({ pageParam }) => api.getNews(pageParam as number, 12, null, "paper"),
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) => (lastPage.next_cursor ? Number(lastPage.next_cursor) : undefined),
    retry: 0,
  });
}

export function useReposFeed() {
  return useInfiniteQuery({
    queryKey: ["news-feed", "source-type", "github-trending"],
    queryFn: ({ pageParam }) => api.getNews(pageParam as number, 12, null, "github-trending"),
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) => (lastPage.next_cursor ? Number(lastPage.next_cursor) : undefined),
    retry: 0,
  });
}

export function useCriticalStories() {
  return useQuery({
    queryKey: ["critical-stories"],
    queryFn: api.getCritical,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60,
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
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: () => api.getArticle(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
}

export function useSearchNews(query: string) {
  return useQuery({
    queryKey: ["search-news", query],
    queryFn: () => api.searchNews(query),
    enabled: query.trim().length > 1,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () => api.getSearchSuggestions(query),
    enabled: query.trim().length > 1,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
