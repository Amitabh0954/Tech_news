import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        critical: "rgb(var(--critical) / <alpha-value>)",
        high: "rgb(var(--high) / <alpha-value>)",
        low: "rgb(var(--low) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Helvetica Neue", "Helvetica", "Inter", "Arial", "ui-sans-serif", "system-ui"],
        heading: ["Helvetica Neue", "Helvetica", "Inter", "Arial", "ui-sans-serif", "system-ui"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(255,255,255,0.04), 0 16px 48px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
