import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { ArticleRoute } from "@/routes/article-route";
import { BookmarksRoute } from "@/routes/bookmarks-route";
import { CriticalRoute } from "@/routes/critical-route";
import { HomeRoute } from "@/routes/home-route";
import { LoginRoute } from "@/routes/login-route";
import { SearchRoute } from "@/routes/search-route";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: "article/:slug", element: <ArticleRoute /> },
      { path: "critical", element: <CriticalRoute /> },
      { path: "search", element: <SearchRoute /> },
      { path: "bookmarks", element: <BookmarksRoute /> },
      { path: "login", element: <LoginRoute /> },
    ],
  },
]);
