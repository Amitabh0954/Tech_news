import { useEffect, useRef, useState } from "react";

import { formatAssistantDateTime } from "@/lib/time";

type Message = {
  id: number;
  role: "bot" | "user";
  text: string;
};

const QUICK_ASKS = ["Top AI shifts", "Cloud risks", "Security pulse", "Tooling worth watching"];

function getReply(prompt: string) {
  const lower = prompt.toLowerCase();

  if (lower.includes("ai")) {
    return "Watch for releases that change real engineering workflow, not just benchmark headlines. The strongest AI signals here are model updates, agent reliability, and pricing or deployment constraints.";
  }

  if (lower.includes("cloud")) {
    return "Cloud stories matter when they change defaults, billing, outages, or deprecation paths. Keep an eye on managed Kubernetes, IAM, and region-level incidents first.";
  }

  if (lower.includes("security")) {
    return "Start with exploitability, dependency reach, and whether the story points to a patch window. Zero-days, supply-chain issues, and high-CVSS advisories deserve immediate attention.";
  }

  if (lower.includes("tool")) {
    return "Tooling is high signal when it changes team throughput or migration cost. Runtime releases, compiler shifts, and editor or CI breakage usually deserve a closer read.";
  }

  return "Use the homepage like a morning engineering brief: urgency first, then score, then source credibility. I can help narrow the feed if you want a security-only or AI-only read.";
}

export function AssistantPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [now, setNow] = useState(new Date());
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "bot",
      text: "Ask for a quick read on the feed, a category snapshot, or what deserves attention first.",
    },
  ]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, typing]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setMessages((current) => [...current, { id: Date.now(), role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);

    window.setTimeout(() => {
      setTyping(false);
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "bot",
          text: getReply(trimmed),
        },
      ]);
    }, 400);
  }

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {isOpen ? (
        <section className="assistant-panel">
          <header className="assistant-header">
            <div>
              <div className="assistant-header-title">EngIntel Assistant</div>
              <div className="assistant-header-sub">{formatAssistantDateTime(now)}</div>
            </div>
            <button type="button" className="assistant-close" onClick={() => setIsOpen(false)}>
              [ CLOSE ]
            </button>
          </header>
          <div className="assistant-chip-row">
            {QUICK_ASKS.map((ask) => (
              <button key={ask} type="button" className="assistant-chip" onClick={() => sendMessage(ask)}>
                {ask}
              </button>
            ))}
          </div>
          <div className="assistant-messages">
            {messages.map((message) => (
              <div key={message.id} className={message.role === "bot" ? "assistant-bot-message" : "assistant-user-message"}>
                {message.text}
              </div>
            ))}
            {typing ? (
              <div className="assistant-bot-message">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}
            <div ref={messageEndRef} />
          </div>
          <form
            className="assistant-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about today's engineering news..."
            />
            <button type="submit">SEND →</button>
          </form>
        </section>
      ) : null}
      <button type="button" className="assistant-launcher" onClick={() => setIsOpen(true)}>
        EngIntel Assistant
      </button>
    </div>
  );
}
