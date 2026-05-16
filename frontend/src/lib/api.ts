const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type Source = {
  id: string;
  name: string;
  slug: string;
  source_type: string;
  homepage_url?: string | null;
  trust_score: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type Summary = {
  what_happened: string;
  why_it_matters: string;
  who_is_affected: string;
  immediate_risks: string;
  long_term_implications: string;
};

export type Impact = {
  impact_score: number;
  ecosystem_reach: number;
  security_severity: number;
  developer_impact: number;
  infra_relevance: number;
  enterprise_relevance: number;
  urgency_score: number;
  novelty: number;
  ai_ecosystem_importance: number;
  downstream_dependency_risk: number;
  why_it_matters: string;
  affected_roles: string[];
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  canonical_url: string;
  excerpt?: string | null;
  image_url?: string | null;
  urgency: string;
  impact_score: number;
  published_at: string;
  source: Source;
  category?: Category | null;
  summary?: Summary | null;
  ecosystem_tags?: string[];
  content?: string | null;
  discussion_url?: string | null;
  impact?: Impact | null;
  related_story_ids?: string[];
};

export type PaginatedArticles = {
  items: Article[];
  next_cursor?: string | null;
  total: number;
};

export type TrendingTopic = {
  topic: string;
  mentions: number;
  momentum: number;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getNews: (page = 1, pageSize = 8, category?: string | null) =>
    request<PaginatedArticles>(
      `/news?page=${page}&page_size=${pageSize}${category ? `&category=${encodeURIComponent(category)}` : ""}`,
    ),
  getCritical: () => request<Article[]>("/critical"),
  getTrending: () => request<TrendingTopic[]>("/trending"),
  getCategories: () => request<Category[]>("/categories"),
  getArticle: (slug: string) => request<Article>(`/news/${slug}`),
  searchNews: (query: string, page = 1, pageSize = 12) =>
    request<PaginatedArticles>(`/search?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`),
};
