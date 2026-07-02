export type CommunityTopic = {
  id: string;
  prompt: string;
  scenario: string;
  cases: string[];
  author_username: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  score: number;
  favorite_count: number;
  myVote: 1 | -1 | 0;
  favorited: boolean;
};

export type NewCommunityTopic = Pick<
  CommunityTopic,
  "id" | "prompt" | "scenario" | "cases" | "author_username" | "created_at"
>;

export type SortMode = "top" | "new";

export async function fetchCommunityTopics(
  sort: SortMode,
  deviceId: string
): Promise<CommunityTopic[]> {
  const params = new URLSearchParams({ sort, deviceId });
  const res = await fetch(`/api/community/topics?${params}`);
  if (!res.ok) throw new Error("Failed to load community topics.");
  const data = await res.json();
  return data.topics ?? [];
}

export async function submitCommunityTopic(input: {
  prompt: string;
  scenario: string;
  cases: string[];
  username: string;
  deviceId: string;
}): Promise<NewCommunityTopic> {
  const res = await fetch("/api/community/topics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Failed to submit topic.");
  return data.topic;
}

export async function voteOnTopic(
  topicId: string,
  deviceId: string,
  value: 1 | -1
): Promise<{ myVote: 1 | -1 | 0 }> {
  const res = await fetch(`/api/community/topics/${topicId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, value }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Failed to update vote.");
  return data;
}

export async function toggleFavorite(
  topicId: string,
  deviceId: string
): Promise<{ favorited: boolean }> {
  const res = await fetch(`/api/community/topics/${topicId}/favorite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Failed to update favorite.");
  return data;
}

/** Timestamp → "2h ago" style relative time. */
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
