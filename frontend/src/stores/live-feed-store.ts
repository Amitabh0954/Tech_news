import { create } from "zustand";

type LiveFeedState = {
  // Count of newly ingested articles the SSE stream has told us about since the
  // user last refreshed the feed. Not persisted — it's meaningless across reloads.
  newCount: number;
  addNew: (count: number) => void;
  reset: () => void;
};

export const useLiveFeedStore = create<LiveFeedState>((set) => ({
  newCount: 0,
  addNew: (count) => set((state) => ({ newCount: state.newCount + count })),
  reset: () => set({ newCount: 0 }),
}));
