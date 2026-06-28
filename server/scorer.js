function scoreArticle(article) {
  let score = 5.0;
  const text = `${article.title || ""} ${article.contentSnippet || ""}`.toLowerCase();

  const critical = [
    { terms: ["zero-day", "0day", "actively exploited"], weight: 3.0 },
    { terms: ["remote code execution", "rce"], weight: 2.8 },
    { terms: ["critical cve", "cvss 9", "cvss 10"], weight: 2.5 },
    { terms: ["supply chain attack", "compromised package"], weight: 2.5 },
    { terms: ["data breach", "leaked credentials"], weight: 2.0 },
    { terms: ["production outage", "service disruption"], weight: 1.8 },
    { terms: ["kubernetes cve", "k8s vulnerability"], weight: 2.0 },
    { terms: ["breaking change", "migration required"], weight: 1.5 },
    { terms: ["deprecated", "end of life", "eol"], weight: 1.2 },
    { terms: ["security advisory", "security patch"], weight: 1.5 },
    { terms: ["ships", "releases", "launches", "announces"], weight: 0.8 },
    { terms: ["new model", "model update", "gpt", "claude", "gemini", "llama", "gemma"], weight: 0.7 },
  ];

  const noise = [
    { terms: ["tutorial", "how to", "beginners guide", "introduction to"], weight: 1.5 },
    { terms: ["opinion", "i think", "my experience"], weight: 1.0 },
    { terms: ["hiring", "job posting", "we are hiring"], weight: 2.0 },
    { terms: ["sponsored", "partner content"], weight: 2.5 },
  ];

  const sourceTrust = {
    "nvd.nist.gov": 1.4,
    "github.com": 1.3,
    "kubernetes.io": 1.25,
    "openai.com": 1.2,
    "aws.amazon.com": 1.2,
    "bleepingcomputer.com": 1.15,
    "thehackernews.com": 1.1,
    "huggingface.co": 1.1,
    "news.ycombinator.com": 1.05,
    "lobste.rs": 1.05,
  };

  const ageHours = (Date.now() - new Date(article.pubDate).getTime()) / 3600000;
  if (ageHours < 2) {
    score += 0.8;
  } else if (ageHours < 6) {
    score += 0.4;
  } else if (ageHours < 24) {
    score += 0.1;
  } else if (ageHours > 72) {
    score -= 0.5;
  }

  critical.forEach((signal) => {
    if (signal.terms.some((term) => text.includes(term))) {
      score += signal.weight;
    }
  });

  noise.forEach((signal) => {
    if (signal.terms.some((term) => text.includes(term))) {
      score -= signal.weight;
    }
  });

  const trust = sourceTrust[article.sourceDomain] || 1.0;
  score *= trust;

  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}

function getBadgeLabel(score) {
  if (score >= 9.0) {
    return "CRITICAL";
  }
  if (score >= 7.5) {
    return "HIGH";
  }
  if (score >= 6.0) {
    return "MEDIUM";
  }
  return "LOW";
}

module.exports = {
  scoreArticle,
  getBadgeLabel,
};
