const Parser = require("rss-parser");
const fetch = require("node-fetch");

const { getBadgeLabel, scoreArticle } = require("./scorer");

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["content:encoded", "contentEncoded"],
      ["enclosure", "enclosure"],
    ],
  },
});

const FEEDS = [
  { url: "https://feeds.feedburner.com/TheHackersNews", source: "The Hacker News", section: "security", domain: "thehackernews.com" },
  { url: "https://www.bleepingcomputer.com/feed/", source: "BleepingComputer", section: "security", domain: "bleepingcomputer.com" },
  { url: "https://github.blog/security/feed/", source: "GitHub Security", section: "security", domain: "github.com" },
  { url: "https://nvd.nist.gov/feeds/json/cve/1.1/nvdcve-1.1-recent.json", source: "NVD / NIST", section: "security", domain: "nvd.nist.gov" },
  { url: "https://openai.com/blog/rss/", source: "OpenAI Blog", section: "ai", domain: "openai.com" },
  { url: "https://www.deepmind.com/blog/rss.xml", source: "DeepMind Blog", section: "ai", domain: "deepmind.com" },
  { url: "https://huggingface.co/blog/feed.xml", source: "HuggingFace Blog", section: "ai", domain: "huggingface.co" },
  { url: "https://ai.googleblog.com/feeds/posts/default", source: "Google AI Blog", section: "ai", domain: "ai.googleblog.com" },
  { url: "https://aws.amazon.com/blogs/aws/feed/", source: "AWS Blog", section: "cloud", domain: "aws.amazon.com" },
  { url: "https://kubernetes.io/feed.xml", source: "Kubernetes Blog", section: "cloud", domain: "kubernetes.io" },
  { url: "https://github.blog/engineering/feed/", source: "GitHub Engineering", section: "cloud", domain: "github.com" },
  { url: "https://devblogs.microsoft.com/typescript/feed/", source: "TypeScript Blog", section: "tooling", domain: "devblogs.microsoft.com" },
  { url: "https://blog.rust-lang.org/feed.xml", source: "Rust Blog", section: "tooling", domain: "blog.rust-lang.org" },
  { url: "https://nodejs.org/en/feed/blog.xml", source: "Node.js Blog", section: "tooling", domain: "nodejs.org" },
  { url: "https://news.ycombinator.com/rss", source: "Hacker News", section: "general", domain: "news.ycombinator.com" },
  { url: "https://lobste.rs/rss", source: "Lobsters", section: "general", domain: "lobste.rs" },
];

const articleCache = new Map();
const sourceStatus = new Map();

let lastFetched = null;
let isRefreshing = false;

function stripHtml(value) {
  return (value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function makeId(value) {
  return Buffer.from(value).toString("base64url");
}

function getSourceHomepage(domain) {
  return `https://${domain}`;
}

function extractImage(item) {
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  if (Array.isArray(item.mediaContent) && item.mediaContent[0]?.$?.url) {
    return item.mediaContent[0].$.url;
  }

  const html = item["content:encoded"] || item.contentEncoded || item.content || item.summary || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function normalizeArticle(feed, item) {
  const originalUrl = item.link || item.guid || `${feed.domain}-${item.title}`;
  const content = stripHtml(item["content:encoded"] || item.contentEncoded || item.content || item.summary || item.contentSnippet || "");
  const deck = content.slice(0, 200);
  const publishedAt = new Date(item.isoDate || item.pubDate || Date.now()).toISOString();
  const score = scoreArticle({
    title: item.title || "Untitled",
    contentSnippet: item.contentSnippet || content,
    sourceDomain: feed.domain,
    pubDate: publishedAt,
  });

  return {
    id: makeId(originalUrl),
    title: item.title || "Untitled",
    deck,
    section: feed.section,
    score,
    badgeLabel: getBadgeLabel(score),
    source: feed.source,
    sourceDomain: feed.domain,
    sourceUrl: getSourceHomepage(feed.domain),
    originalUrl,
    imageUrl: extractImage(item),
    publishedAt,
    content,
  };
}

function normalizeNvdItem(feed, vulnerability) {
  const cve = vulnerability.cve || {};
  const description =
    cve.descriptions?.find((entry) => entry.lang === "en")?.value ||
    "Recent CVE added to the National Vulnerability Database.";
  const publishedAt = cve.published || new Date().toISOString();
  const baseScore =
    vulnerability.cve?.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ||
    vulnerability.cve?.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore ||
    vulnerability.cve?.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore;
  const title = `${cve.id || "CVE"} ${baseScore ? `CVSS ${baseScore}` : ""}`.trim();
  const originalUrl = `https://nvd.nist.gov/vuln/detail/${cve.id}`;
  const score = scoreArticle({
    title,
    contentSnippet: description,
    sourceDomain: feed.domain,
    pubDate: publishedAt,
  });

  return {
    id: makeId(originalUrl),
    title,
    deck: stripHtml(description).slice(0, 200),
    section: feed.section,
    score,
    badgeLabel: getBadgeLabel(score),
    source: feed.source,
    sourceDomain: feed.domain,
    sourceUrl: getSourceHomepage(feed.domain),
    originalUrl,
    imageUrl: null,
    publishedAt: new Date(publishedAt).toISOString(),
    content: stripHtml(description),
  };
}

async function fetchXmlFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      "user-agent": "EngIntel/1.0 (+rss aggregator)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const xml = await response.text();
  const parsed = await parser.parseString(xml);
  return (parsed.items || []).map((item) => normalizeArticle(feed, item));
}

async function fetchNvdFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      "user-agent": "EngIntel/1.0 (+rss aggregator)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return (data.vulnerabilities || []).slice(0, 40).map((entry) => normalizeNvdItem(feed, entry));
}

async function refreshFeed(feed) {
  const items = feed.url.endsWith(".json") ? await fetchNvdFeed(feed) : await fetchXmlFeed(feed);
  sourceStatus.set(feed.domain, {
    source: feed.source,
    domain: feed.domain,
    section: feed.section,
    lastFetched: new Date().toISOString(),
    count: items.length,
    ok: true,
  });
  return items;
}

async function refreshAllFeeds() {
  if (isRefreshing) {
    return getAllArticles();
  }

  isRefreshing = true;

  try {
    const results = await Promise.allSettled(FEEDS.map((feed) => refreshFeed(feed)));
    const nextCache = new Map();

    results.forEach((result, index) => {
      const feed = FEEDS[index];

      if (result.status === "rejected") {
        sourceStatus.set(feed.domain, {
          source: feed.source,
          domain: feed.domain,
          section: feed.section,
          lastFetched: sourceStatus.get(feed.domain)?.lastFetched || null,
          count: 0,
          ok: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
        return;
      }

      result.value.forEach((article) => {
        const existing = nextCache.get(article.originalUrl);
        if (!existing || existing.score < article.score || existing.publishedAt < article.publishedAt) {
          nextCache.set(article.originalUrl, article);
        }
      });
    });

    articleCache.clear();
    nextCache.forEach((value, key) => {
      articleCache.set(key, value);
    });

    lastFetched = new Date().toISOString();
    return getAllArticles();
  } finally {
    isRefreshing = false;
  }
}

function getAllArticles() {
  return Array.from(articleCache.values()).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

function getArticleById(id) {
  return getAllArticles().find((article) => article.id === id) || null;
}

function getFeedMeta() {
  const articles = getAllArticles();
  const activeAlerts = articles.filter((article) => article.score >= 8.0).length;
  return {
    lastFetched,
    activeAlerts,
    totalSources: FEEDS.length,
  };
}

function getStats() {
  const articles = getAllArticles();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayItems = articles.filter((article) => new Date(article.publishedAt) >= startOfDay);
  const sectionCounts = todayItems.reduce((acc, article) => {
    acc[article.section] = (acc[article.section] || 0) + 1;
    return acc;
  }, {});
  const topSection = Object.entries(sectionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "general";

  return {
    totalToday: todayItems.length,
    criticalCount: articles.filter((article) => article.score >= 8.0).length,
    topSection,
  };
}

function getSources() {
  return FEEDS.map((feed) => ({
    source: feed.source,
    domain: feed.domain,
    section: feed.section,
    lastFetched: sourceStatus.get(feed.domain)?.lastFetched || null,
    count: sourceStatus.get(feed.domain)?.count || 0,
    ok: sourceStatus.get(feed.domain)?.ok ?? false,
  }));
}

function ensureRefreshLoop() {
  refreshAllFeeds().catch(() => {});
  setInterval(() => {
    refreshAllFeeds().catch(() => {});
  }, 15 * 60 * 1000);
}

module.exports = {
  FEEDS,
  ensureRefreshLoop,
  getAllArticles,
  getArticleById,
  getFeedMeta,
  getSources,
  getStats,
  refreshAllFeeds,
};
