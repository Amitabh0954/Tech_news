const cors = require("cors");
const express = require("express");

const {
  ensureRefreshLoop,
  getAllArticles,
  getArticleById,
  getFeedMeta,
  getSources,
  getStats,
  refreshAllFeeds,
} = require("./feedFetcher");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

function sortArticles(articles, sortBy) {
  if (sortBy === "date") {
    return [...articles].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  return [...articles].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
}

app.get("/api/articles", async (req, res) => {
  if (!getAllArticles().length) {
    await refreshAllFeeds();
  }

  const section = req.query.section || "all";
  const limit = Number(req.query.limit || 30);
  const minScore = Number(req.query.minScore || 6.5);
  const sortBy = req.query.sortBy || "score";

  let articles = getAllArticles();
  if (section !== "all") {
    articles = articles.filter((article) => article.section === section);
  }
  articles = articles.filter((article) => article.score >= minScore);
  articles = sortArticles(articles, sortBy).slice(0, limit);

  res.json({
    articles,
    ...getFeedMeta(),
  });
});

app.get("/api/articles/:id", async (req, res) => {
  if (!getAllArticles().length) {
    await refreshAllFeeds();
  }

  const article = getArticleById(req.params.id);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json(article);
});

app.get("/api/sources", async (_req, res) => {
  if (!getAllArticles().length) {
    await refreshAllFeeds();
  }

  res.json({
    sources: getSources(),
    lastFetched: getFeedMeta().lastFetched,
  });
});

app.get("/api/stats", async (_req, res) => {
  if (!getAllArticles().length) {
    await refreshAllFeeds();
  }

  res.json(getStats());
});

app.listen(PORT, () => {
  ensureRefreshLoop();
  console.log(`EngIntel RSS server listening on http://localhost:${PORT}`);
});
