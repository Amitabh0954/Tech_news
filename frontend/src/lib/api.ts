import { useAuthStore } from "@/stores/auth-store";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api/v1").replace(/\/$/, "");

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  theme: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Unable to reach the API. Start the backend or check VITE_API_BASE_URL.");
    }
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      // Expired/invalid session: clear auth so the router's ProtectedApp guard
      // redirects to /login instead of every authenticated call surfacing its
      // own confusing "could not load" error.
      useAuthStore.getState().clearAuth();
    }
    if (typeof data === "object" && data && "detail" in data) {
      throw new Error(String(data.detail));
    }
    // A non-JSON error body (data === null) almost always means the request never
    // reached the FastAPI app at all — e.g. the backend isn't running and the Vite
    // dev proxy (or a host's reverse proxy) returned its own bare error page instead.
    if (data === null) {
      throw new Error("Unable to reach the API. Start the backend or check VITE_API_BASE_URL.");
    }
    throw new Error("Request failed");
  }
  return data as T;
}

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, display_name: string) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, display_name }),
      }),
    me: (token: string) =>
      request<AuthUser>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
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
  getBookmarks: () => request<Article[]>("/bookmarks", { headers: authHeaders() }),
  addBookmark: (articleId: string) =>
    request<{ status: string }>("/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ article_id: articleId }),
    }),
  removeBookmark: (articleId: string) =>
    request<void>(`/bookmarks/${articleId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),
};
