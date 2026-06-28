import { useEffect, useState } from "react";

import { useFeedStatus } from "@/features/articles/queries";
import { formatLastUpdated, formatTopBarDateTime } from "@/lib/time";

export function LiveStatusBar() {
  const [now, setNow] = useState(new Date());
  const { data } = useFeedStatus();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const leftLabel = formatTopBarDateTime(now);
  const rightLabel = `${data?.activeAlerts ?? 0} ACTIVE ALERTS \u00b7 ${formatLastUpdated(data?.lastFetched, now)}`;

  return (
    <div className="live-status-bar">
      <span className="live-status-left">{leftLabel}</span>
      <span className="live-status-right">{rightLabel}</span>
    </div>
  );
}
