import { cn } from "@/lib/utils";

const urgencyStyles: Record<string, string> = {
  critical: "border-critical/50 bg-critical/10 text-critical",
  high: "border-high/50 bg-high/10 text-high",
  medium: "border-accent/30 bg-accent/10 text-accent",
  low: "border-low/50 bg-low/10 text-low",
};

export function ImpactBadge({
  score,
  urgency,
}: {
  score: number;
  urgency: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
        urgencyStyles[urgency] ?? urgencyStyles.medium,
      )}
    >
      <span>{urgency}</span>
      <span className="font-mono">{score.toFixed(1)}</span>
    </div>
  );
}
