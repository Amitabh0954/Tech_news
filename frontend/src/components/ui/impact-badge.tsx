import { cn } from "@/lib/utils";

const urgencyStyles: Record<string, string> = {
  critical: "text-critical",
  high: "text-high",
  medium: "text-accent",
  low: "text-low",
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
      className={cn("inline-flex items-center gap-1.5 text-sm", urgencyStyles[urgency] ?? urgencyStyles.medium)}
    >
      <span className="font-heading font-semibold capitalize">{urgency}</span>
      <span className="font-mono font-semibold">{score.toFixed(1)}</span>
    </div>
  );
}
