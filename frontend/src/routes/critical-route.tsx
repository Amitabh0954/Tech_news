import { NewsSection } from "@/components/news/news-section";
import { useCriticalStories } from "@/features/articles/queries";

export function CriticalRoute() {
  const { data, isLoading } = useCriticalStories();

  if (isLoading) {
    return <div className="h-64 animate-pulse border border-border bg-panel dark:border-white/10" />;
  }

  return <NewsSection title="Critical Alerts" items={data ?? []} />;
}
