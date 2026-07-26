import { Outlet, useLocation } from "react-router-dom";

import { SiteFooter } from "@/components/layout/site-footer";
import { TopHeader } from "@/components/layout/top-header";
import { useLiveUpdates } from "@/features/articles/use-live-updates";

export function AppShell() {
  useLiveUpdates();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-900 dark:text-slate-100">
      <TopHeader />
      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 lg:px-8">
        <main key={location.pathname} className="page-transition min-w-0">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
