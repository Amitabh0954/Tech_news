import { Navigate, Outlet, useLocation } from "react-router-dom";

import { StickySidebar } from "@/components/layout/sticky-sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { useAuthStore } from "@/stores/auth-store";

export function AppShell() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated && location.pathname !== "/login") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isAuthenticated && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-zinc-900 dark:text-slate-100">
      <TopHeader />
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <main className="min-w-0">
          <Outlet />
        </main>
        <StickySidebar />
      </div>
    </div>
  );
}
