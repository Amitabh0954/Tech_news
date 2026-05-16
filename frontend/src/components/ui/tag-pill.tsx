export function TagPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-panel px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      {label}
    </span>
  );
}
