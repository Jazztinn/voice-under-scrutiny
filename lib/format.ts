/** Seconds → "M:SS". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

/** Timestamp → readable date + time. */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Rough word count of a transcript. */
export function wordCount(text: string | null): number {
  if (!text) return 0;
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}
