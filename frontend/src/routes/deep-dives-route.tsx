import type { SyntheticEvent } from "react";
import { useMemo, useState } from "react";

type DeepDiveTab = "ALL" | "AI & AGENTS" | "SYSTEMS" | "HARDWARE" | "SECURITY" | "ALGORITHMS" | "TOOLING";
type VideoCategory = Exclude<DeepDiveTab, "ALL">;

const TABS: DeepDiveTab[] = ["ALL", "AI & AGENTS", "SYSTEMS", "HARDWARE", "SECURITY", "ALGORITHMS", "TOOLING"];

const CURATED_VIDEOS: Array<{
  id: string;
  channel: string;
  title: string;
  category: VideoCategory;
  duration: string;
  ytUrl: string;
}> = [
  { id: "jZi3ewaznZA", channel: "ThePrimeagen", title: "Vim Motions Will Change How You Code Forever", category: "SYSTEMS", duration: "18 min", ytUrl: "https://youtube.com/watch?v=jZi3ewaznZA" },
  { id: "Tn6-PIqc4UM", channel: "Fireship", title: "JavaScript in 100 Seconds", category: "TOOLING", duration: "2 min", ytUrl: "https://youtube.com/watch?v=Tn6-PIqc4UM" },
  { id: "DHjqpvDnNGE", channel: "Fireship", title: "Rust in 100 Seconds", category: "SYSTEMS", duration: "2 min", ytUrl: "https://youtube.com/watch?v=DHjqpvDnNGE" },
  { id: "LtZE3PpFmJk", channel: "Linus Tech Tips", title: "GPU Benchmark Tier List 2026", category: "HARDWARE", duration: "24 min", ytUrl: "https://youtube.com/watch?v=LtZE3PpFmJk" },
  { id: "L1eegVTlONI", channel: "Linus Tech Tips", title: "Why Your CPU Thermals Are Lying to You", category: "HARDWARE", duration: "17 min", ytUrl: "https://youtube.com/watch?v=L1eegVTlONI" },
  { id: "0_Yl8S-_E0s", channel: "AI Explained", title: "The State of AI — Weekly Breakdown", category: "AI & AGENTS", duration: "12 min", ytUrl: "https://youtube.com/watch?v=0_Yl8S-_E0s" },
  { id: "AoeawwYI4RA", channel: "Computerphile", title: "How Dijkstra's Algorithm Actually Works", category: "ALGORITHMS", duration: "9 min", ytUrl: "https://youtube.com/watch?v=AoeawwYI4RA" },
  { id: "vsXMMT2CqqE", channel: "Low Level Learning", title: "Memory Layout in C — Visualized", category: "SYSTEMS", duration: "11 min", ytUrl: "https://youtube.com/watch?v=vsXMMT2CqqE" },
  { id: "qiQR5rTSshw", channel: "NetworkChuck", title: "How Hackers Use Your Own Tools Against You", category: "SECURITY", duration: "20 min", ytUrl: "https://youtube.com/watch?v=qiQR5rTSshw" },
];

function handleVideoImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.src.includes("/hqdefault.jpg")) {
    image.src = image.src.replace("/hqdefault.jpg", "/mqdefault.jpg");
    return;
  }
  image.style.display = "none";
}

export function DeepDivesRoute() {
  const [activeTab, setActiveTab] = useState<DeepDiveTab>("ALL");

  const filteredVideos = useMemo(() => {
    if (activeTab === "ALL") {
      return CURATED_VIDEOS;
    }
    return CURATED_VIDEOS.filter((video) => video.category === activeTab);
  }, [activeTab]);

  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-5">
        <div className="byline-meta text-accent">Deep Dives</div>
        <h1 className="hl-xl mt-3 text-[#0d0d0d]">Engineering video briefings worth your time</h1>
        <p className="deck-text mt-4 max-w-3xl">
          Curated YouTube deep dives across AI, systems, hardware, security, and algorithms without leaving the EngIntel flow.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`deep-dive-filter-tab ${activeTab === tab ? "deep-dive-filter-tab-active" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredVideos.map((video) => (
          <article key={video.id} className="deep-dive-card cursor-pointer" onClick={() => window.open(video.ytUrl, "_blank")}>
            <div className="deep-dive-thumb">
              <img
                src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                alt={video.title}
                className="absolute inset-0 h-full w-full object-cover"
                onError={handleVideoImageError}
              />
              <div className="deep-dive-overlay">
                <div className="deep-dive-play-button">
                  <div className="deep-dive-play" />
                </div>
              </div>
            </div>
            <div className="deep-dive-card-body">
              <div className="deep-dive-card-meta">
                <div className="deep-dive-card-channel">{video.channel}</div>
                <div className="deep-dive-card-category">{video.category}</div>
              </div>
              <div className="deep-dive-card-title">{video.title}</div>
              <div className="deep-dive-card-duration">▶ {video.duration.toUpperCase()}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
