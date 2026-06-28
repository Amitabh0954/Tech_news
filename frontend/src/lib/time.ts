const INDIA_TIMEZONE = "Asia/Kolkata";

export function formatTopBarDateTime(now: Date) {
  const date = now
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: INDIA_TIMEZONE,
    })
    .toUpperCase();

  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: INDIA_TIMEZONE,
  });

  return `${date} \u00b7 ${time} IST`;
}

export function formatAssistantDateTime(now: Date) {
  const date = now
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: INDIA_TIMEZONE,
    })
    .toUpperCase();

  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: INDIA_TIMEZONE,
  });

  return `${date} \u00b7 ${time}`;
}

export function formatLastUpdated(lastFetched?: string | null, now = new Date()) {
  if (!lastFetched) {
    return "LAST UPDATED JUST NOW";
  }

  const diffMinutes = Math.max(0, Math.floor((now.getTime() - new Date(lastFetched).getTime()) / 60000));
  if (diffMinutes < 1) {
    return "LAST UPDATED JUST NOW";
  }
  if (diffMinutes === 1) {
    return "LAST UPDATED 1 MIN AGO";
  }
  if (diffMinutes < 60) {
    return `LAST UPDATED ${diffMinutes} MIN AGO`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `LAST UPDATED ${diffHours} H AGO`;
}
