"use client";

import { useEffect, useState } from "react";
import { getDeviceId } from "@/lib/identity";
import { fetchCommunityTopics, type CommunityTopic, type SortMode } from "@/lib/community";
import CommunityTopicCard from "@/components/community/CommunityTopicCard";
import SubmitTopicForm from "@/components/community/SubmitTopicForm";

function CommunityTopicSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2.5">
          <div className="skeleton-shimmer h-5 w-11/12 rounded-full" />
          <div className="skeleton-shimmer h-5 w-7/12 rounded-full" />
        </div>
        <div className="skeleton-shimmer h-3 w-12 shrink-0 rounded-full" />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="skeleton-shimmer h-4 w-4 rounded-full" />
        <div className="skeleton-shimmer h-4 w-36 rounded-full" />
      </div>

      <div
        className="mt-3 rounded-2xl border border-border bg-muted/40 p-4"
        style={{
          boxShadow:
            "inset 0 2px 4px rgba(0,0,0,0.08), inset 0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <div className="skeleton-shimmer h-6 w-24 rounded-full" />
        <div className="mt-3 space-y-2">
          <div className="skeleton-shimmer h-3.5 w-full rounded-full" />
          <div className="skeleton-shimmer h-3.5 w-10/12 rounded-full" />
          <div className="skeleton-shimmer h-3.5 w-8/12 rounded-full" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="skeleton-shimmer h-9 w-32 rounded-full" />
        <div className="skeleton-shimmer h-9 w-28 rounded-full" />
      </div>
    </div>
  );
}

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
    setError(null);
    fetchCommunityTopics(sort, deviceId)
      .then(setTopics)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load community topics.")
      );
  }, [sort, deviceId]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="overflow-hidden rounded-3xl bg-highlight p-6 shadow-sm sm:p-8">
        <span className="chip">Community</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-highlight-foreground sm:text-4xl">
          Topics from other speakers.
        </h1>
        <p className="mt-2 text-sm text-highlight-foreground/80">
          Upvote what&apos;s good, star what you want to come back to, or add
          your own.
        </p>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          disabled={!deviceId}
          className="btn-emboss mt-5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
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
                ? "btn-emboss bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {s === "top" ? "Top" : "Newest"}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!error && topics === null && (
        <div
          className="flex flex-col gap-4"
          aria-label="Loading community topics"
          aria-busy="true"
        >
          {Array.from({ length: 3 }, (_, i) => (
            <CommunityTopicSkeleton key={i} />
          ))}
        </div>
      )}

      {topics && topics.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
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
