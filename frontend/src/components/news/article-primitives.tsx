import type { ReactNode, SyntheticEvent } from "react";

import type { Article } from "@/lib/api";
import { cn } from "@/lib/utils";

function IconFrame({
  children,
  size = 44,
  stroke = 1,
}: {
  children: ReactNode;
  size?: number;
  stroke?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function IconShield({ size, stroke }: { size?: number; stroke?: number }) {
  return (
    <IconFrame size={size} stroke={stroke}>
      <path d="M24 6l14 5v10c0 10-5.7 16.7-14 21-8.3-4.3-14-11-14-21V11l14-5z" />
      <path d="M18 24l4 4 8-9" />
    </IconFrame>
  );
}

function IconCpu({ size, stroke }: { size?: number; stroke?: number }) {
  return (
    <IconFrame size={size} stroke={stroke}>
      <rect x="14" y="14" width="20" height="20" rx="2" />
      <rect x="19" y="19" width="10" height="10" rx="1.5" />
      <path d="M18 8v6M24 8v6M30 8v6M18 34v6M24 34v6M30 34v6M8 18h6M8 24h6M8 30h6M34 18h6M34 24h6M34 30h6" />
    </IconFrame>
  );
}

function IconCloud({ size, stroke }: { size?: number; stroke?: number }) {
  return (
    <IconFrame size={size} stroke={stroke}>
      <path d="M15 33h18a7 7 0 0 0 1-13.9A10.5 10.5 0 0 0 14 15.5 7.5 7.5 0 0 0 15 33z" />
      <path d="M19 27h10" />
    </IconFrame>
  );
}

function IconTool({ size, stroke }: { size?: number; stroke?: number }) {
  return (
    <IconFrame size={size} stroke={stroke}>
      <path d="M31 10a8 8 0 0 0-8 8 7.7 7.7 0 0 0 .7 3.2L12 33l3 3 11.8-11.7A8 8 0 1 0 31 10z" />
      <path d="M28 14l6 6" />
    </IconFrame>
  );
}

function IconCode({ size, stroke }: { size?: number; stroke?: number }) {
  return (
    <IconFrame size={size} stroke={stroke}>
      <path d="M18 16L10 24l8 8M30 16l8 8-8 8M26 12l-4 24" />
    </IconFrame>
  );
}

export function getArticleSection(article: Article) {
  return article.category?.slug ?? "oss";
}

export function getArticleSourceUrl(article: Article) {
  if (article.source.homepage_url?.trim()) {
    return article.source.homepage_url;
  }

  try {
    return new URL(article.canonical_url).origin;
  } catch {
    return article.canonical_url;
  }
}

export function getArticleSourceName(article: Article) {
  const sourceUrl = getArticleSourceUrl(article);

  try {
    return new URL(sourceUrl).hostname.replace("www.", "");
  } catch {
    return article.source.name;
  }
}

export function hasArticleImage(article: Article) {
  return Boolean(article.image_url && article.image_url.trim() !== "");
}

export function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  image.style.display = "none";
  const fallback = image.nextElementSibling as HTMLElement | null;
  if (fallback) {
    fallback.style.display = "flex";
  }
}

export function DateLine({ timestamp }: { timestamp: string }) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / 3600000;

  const relative = diffHours < 1 ? "Just now" : diffHours < 24 ? `${Math.floor(diffHours)}h ago` : null;

  const absolute =
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) +
    " · " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return <span className="dateline">{relative ? `${relative} · ${absolute}` : absolute}</span>;
}

export function CardNoImage({
  article,
  className,
  hidden = false,
}: {
  article: Article;
  className?: string;
  hidden?: boolean;
}) {
  const section = getArticleSection(article);

  return (
    <div className={cn("card-no-image", hidden && "hidden", className)}>
      <div className="card-no-image-icon">
        {section === "security" && <IconShield size={44} stroke={1} />}
        {section === "ai" && <IconCpu size={44} stroke={1} />}
        {section === "cloud" && <IconCloud size={44} stroke={1} />}
        {section === "tooling" && <IconTool size={44} stroke={1} />}
        {section === "oss" && <IconCode size={44} stroke={1} />}
        {!["security", "ai", "cloud", "tooling", "oss"].includes(section) && <IconCode size={44} stroke={1} />}
      </div>
      <span className="card-no-image-source">{getArticleSourceName(article)}</span>
    </div>
  );
}

export function CardFooter({
  originalUrl,
  sourceUrl,
  sourceName,
  className,
}: {
  originalUrl?: string | null;
  sourceUrl: string;
  sourceName: string;
  className?: string;
}) {
  return (
    <div className={cn("card-footer", className)}>
      {originalUrl ? (
        <a href={originalUrl} target="_blank" rel="noopener" className="readmore">
          Continue reading →
        </a>
      ) : (
        <span className="source-unavailable">Source unavailable</span>
      )}
      <a href={sourceUrl} target="_blank" rel="noopener" className="source-badge">
        <span className="source-dot" />
        {sourceName}
      </a>
    </div>
  );
}
