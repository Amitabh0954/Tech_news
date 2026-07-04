import { Link } from "react-router-dom";

import { motion } from "framer-motion";

import type { Article } from "@/lib/api";
import { ImpactBadge } from "@/components/ui/impact-badge";
import { DateLine } from "@/components/news/article-primitives";

export function CriticalAlertStrip({ items }: { items: Article[] }) {
  return (
    <section className="border-y border-critical/30 bg-white py-4 dark:bg-panel">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-critical">Critical Alerts</div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="border-l-2 border-critical bg-critical/5 transition-colors hover:bg-critical/10"
          >
            <Link to={`/app/article/${item.slug}`} className="block p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <ImpactBadge score={item.impact_score} urgency={item.urgency} />
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-slate-500">
                  {item.source.name} · <DateLine timestamp={item.published_at} />
                </div>
              </div>
              <h2 className="font-heading text-lg font-semibold leading-tight text-zinc-900 dark:text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-slate-300">
                {item.summary?.why_it_matters ?? item.excerpt ?? "High-impact engineering event requiring attention."}
              </p>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
