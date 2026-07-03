import { Outlet } from "react-router-dom";

import { TopHeader } from "@/components/layout/top-header";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-zinc-900 dark:text-slate-100">
      <TopHeader />
      <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
