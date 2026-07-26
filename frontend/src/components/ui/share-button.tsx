import { useState } from "react";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User dismissed the native share sheet — not an error.
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void handleShare();
      }}
      className="rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-500 transition-colors hover:border-accent/40 hover:text-accent dark:border-white/10 dark:text-slate-400"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
