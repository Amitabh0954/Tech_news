import { useEffect } from "react";

import { API_BASE_URL } from "@/lib/api";
import { useLiveFeedStore } from "@/stores/live-feed-store";

type NewArticlesEvent = {
  type: "new_articles";
  count: number;
};

// Subscribes to the backend's SSE stream so the "N new stories" banner can appear
// the moment a fresh ingestion cycle lands, instead of waiting for the next poll.
// The browser's EventSource retries the connection automatically on drop, so no
// manual reconnect logic is needed here.
export function useLiveUpdates() {
  const addNew = useLiveFeedStore((state) => state.addNew);

  useEffect(() => {
    const source = new EventSource(`${API_BASE_URL}/stream/latest`);

    source.onmessage = (event) => {
      let payload: NewArticlesEvent;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      if (payload.type === "new_articles" && payload.count > 0) {
        addNew(payload.count);
      }
    };

    return () => source.close();
  }, [addNew]);
}
