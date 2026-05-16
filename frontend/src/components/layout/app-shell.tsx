import { Outlet } from "react-router-dom";

import { StickySidebar } from "@/components/layout/sticky-sidebar";
import { TopHeader } from "@/components/layout/top-header";

export function AppShell() {
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
