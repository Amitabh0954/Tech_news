import { cn } from "@/lib/utils";

/** Muted, per-category pastel pill (light mode only — dark mode keeps the neutral
    outline treatment it already had). Only a handful of categories get an explicit
    hue; anything else falls back to the neutral default so new categories never
    render unstyled. */
const categoryPillStyles: Record<string, string> = {
  oss: "bg-[#EFF6FF] text-[#2563EB]",
  tooling: "bg-[#ECFDF5] text-[#15803D]",
  infra: "bg-[#FFF7ED] text-[#EA580C]",
  ai: "bg-[#FFFBEB] text-[#B45309]",
  security: "bg-[#FEF2F2] text-[#DC2626]",
  cloud: "bg-[#F0F9FF] text-[#0369A1]",
  research: "bg-[#F8FAFC] text-[#475569]",
  "supply-chain": "bg-[#FFF7ED] text-[#C2410C]",
  mobile: "bg-[#EEF2FF] text-[#4338CA]",
  databases: "bg-[#EFF6FF] text-[#1D4ED8]",
  "web-frontend": "bg-[#FDF2F8] text-[#BE185D]",
  "data-engineering": "bg-[#ECFDF5] text-[#4D7C0F]",
};
const defaultPillStyle = "bg-slate-100 text-slate-600";

export function TagPill({ label, slug }: { label: string; slug?: string }) {
  const lightStyle = (slug && categoryPillStyles[slug]) || defaultPillStyle;

  return (
    <span
      className={cn(
        "rounded-full border border-transparent px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
        lightStyle,
      )}
    >
      {label}
    </span>
  );
}
