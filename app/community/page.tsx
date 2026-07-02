"use client";

import { useEffect, useState } from "react";
import { getDeviceId } from "@/lib/identity";
import { fetchCommunityTopics, type CommunityTopic, type SortMode } from "@/lib/community";
import CommunityTopicCard from "@/components/community/CommunityTopicCard";
import SubmitTopicForm from "@/components/community/SubmitTopicForm";

export default function CommunityPage() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("top");
  const [topics, setTopics] = useState<CommunityTopic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // Reads localStorage; can't run during SSR/render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeviceId(getDeviceId());
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTopics(null);
    fetchCommunityTopics(sort, deviceId)
      .then(setTopics)
      .catch(() => setError("Could not load community topics."));
  }, [sort, deviceId]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="overflow-hidden rounded-2xl bg-highlight p-6">
        <h1 className="font-display text-2xl font-extrabold text-highlight-foreground">
          Community topics
        </h1>
        <p className="mt-1.5 text-sm text-highlight-foreground/80">
          Prompts submitted by other speakers. Upvote what&apos;s good, star what
          you want to come back to, or add your own.
        </p>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          disabled={!deviceId}
          className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
        >
          Submit a topic
        </button>
      </div>

      <div className="flex items-center gap-1 self-start rounded-full border border-border bg-card p-1">
        {(["top", "new"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition ${
              sort === s
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {s === "top" ? "Top" : "Newest"}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!error && topics === null && (
        <p className="text-muted-foreground">Loading…</p>
      )}

      {topics && topics.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">No community topics yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to submit one.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {deviceId &&
          topics?.map((t) => (
            <CommunityTopicCard key={t.id} topic={t} deviceId={deviceId} />
          ))}
      </div>

      {deviceId && (
        <SubmitTopicForm
          open={formOpen}
          deviceId={deviceId}
          onClose={() => setFormOpen(false)}
          onSubmitted={(topic) =>
            setTopics((prev) => {
              const fresh: CommunityTopic = {
                id: topic.id,
                prompt: topic.prompt,
                scenario: topic.scenario,
                cases: topic.cases,
                author_username: topic.author_username,
                created_at: topic.created_at,
                upvotes: 0,
                downvotes: 0,
                score: 0,
                favorite_count: 0,
                myVote: 0,
                favorited: false,
              };
              return prev ? [fresh, ...prev] : [fresh];
            })
          }
        />
      )}
    </main>
  );
}
