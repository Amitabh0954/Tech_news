import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { ArchitecturePage } from "@/features/architecture/architecture-page";
import { ArticleRoute } from "@/routes/article-route";
import { BookmarksRoute } from "@/routes/bookmarks-route";
import { CriticalRoute } from "@/routes/critical-route";
import { HomeRoute } from "@/routes/home-route";
import { LoginRoute } from "@/routes/login-route";
import { SearchRoute } from "@/routes/search-route";
import { useAuthStore } from "@/stores/auth-store";

function RootRedirect() {
  const token = useAuthStore((state) => state.token);
  return <Navigate to={token ? "/app" : "/login"} replace />;
}

function LoginRedirect() {
  const token = useAuthStore((state) => state.token);
  return token ? <Navigate to="/app" replace /> : <LoginRoute />;
}

function ProtectedApp() {
  const token = useAuthStore((state) => state.token);
  return token ? <AppShell /> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },
  { path: "/login", element: <LoginRedirect /> },
  {
    path: "/app",
    element: <ProtectedApp />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: "article/:slug", element: <ArticleRoute /> },
      { path: "critical", element: <CriticalRoute /> },
      { path: "search", element: <SearchRoute /> },
      { path: "bookmarks", element: <BookmarksRoute /> },
      { path: "architecture", element: <ArchitecturePage /> },
      { path: "*", element: <Navigate to="/app" replace /> },
    ],
  },
  { path: "*", element: <RootRedirect /> },
]);
