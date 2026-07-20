export type DateFilterOption = {
  label: string;
  days: number | null;
};

// `days: null` means "all time" (no cutoff, no `days` query param sent at all).
export const DATE_FILTER_OPTIONS: DateFilterOption[] = [
  { label: "All time", days: null },
  { label: "Today", days: 1 },
  { label: "This week", days: 7 },
  { label: "This month", days: 30 },
];

export const DATE_FILTER_LABELS: Record<string, string> = Object.fromEntries(
  DATE_FILTER_OPTIONS.filter((option) => option.days !== null).map((option) => [String(option.days), option.label]),
);
