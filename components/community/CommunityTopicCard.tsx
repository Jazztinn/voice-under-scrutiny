"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  relativeTime,
  toggleFavorite,
  voteOnTopic,
  type CommunityTopic,
} from "@/lib/community";

type Props = {
  topic: CommunityTopic;
  deviceId: string;
};

export default function CommunityTopicCard({ topic: initial, deviceId }: Props) {
  const router = useRouter();
  const [topic, setTopic] = useState(initial);
  const [open, setOpen] = useState(true);

  // Voting/favoriting update the UI immediately (same toggle-off math the
  // server applies) instead of waiting on the round-trip — otherwise a click
  // looks like it did nothing, and a second click before the first response
  // lands reads as "un-vote" instead of "still working".
  async function handleVote(value: 1 | -1) {
    const before = topic;
    const nextMyVote: 1 | -1 | 0 = before.myVote === value ? 0 : value;
    let upvotes = before.upvotes;
    let downvotes = before.downvotes;
    if (before.myVote === 1) upvotes -= 1;
    if (before.myVote === -1) downvotes -= 1;
    if (nextMyVote === 1) upvotes += 1;
    if (nextMyVote === -1) downvotes += 1;
    setTopic({ ...before, myVote: nextMyVote, upvotes, downvotes, score: upvotes - downvotes });

    try {
      await voteOnTopic(before.id, deviceId, value);
    } catch {
      setTopic(before);
    }
  }

  async function handleFavorite() {
    const before = topic;
    const favorited = !before.favorited;
    setTopic({
      ...before,
      favorited,
      favorite_count: before.favorite_count + (favorited ? 1 : -1),
    });

    try {
      await toggleFavorite(before.id, deviceId);
    } catch {
      setTopic(before);
    }
  }

  function practiceThis() {
    sessionStorage.setItem("queuedTopic", topic.prompt);
    router.push("/");
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-medium leading-snug text-foreground">
          {topic.prompt}
        </p>
        <span className="shrink-0 pt-1.5 text-xs text-muted-foreground">
          {relativeTime(topic.created_at)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 flex items-center gap-1.5 self-start text-sm font-medium text-accent transition hover:text-accent-hover"
      >
        <span className={`inline-block transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          ›
        </span>
        {open ? "Hide details" : "See scenario & cases"}
      </button>

      <div
        className={`grid transition-all duration-300 ${
          open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className="rounded-2xl border border-border bg-muted/40 p-4"
            style={{
              boxShadow:
                "inset 0 2px 4px rgba(0,0,0,0.08), inset 0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <span className="chip">Scenario</span>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              {topic.scenario}
            </p>
            {topic.cases.length > 0 && (
              <>
                <p className="mt-4">
                  <span className="chip">Try these angles</span>
                </p>
                <ul className="mt-2 space-y-1.5">
                  {topic.cases.map((c) => (
                    <li key={c} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
                      <span className="mt-0.5 text-accent">→</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border bg-muted/40 px-1 py-1">
          <button
            type="button"
            onClick={() => handleVote(1)}
            aria-label="Upvote"
            aria-pressed={topic.myVote === 1}
            className={`rounded-full px-2 py-1 text-sm transition hover:bg-muted ${
              topic.myVote === 1 ? "text-accent" : "text-muted-foreground"
            }`}
          >
            ▲
          </button>
          <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums text-foreground">
            {topic.score}
          </span>
          <button
            type="button"
            onClick={() => handleVote(-1)}
            aria-label="Downvote"
            aria-pressed={topic.myVote === -1}
            className={`rounded-full px-2 py-1 text-sm transition hover:bg-muted ${
              topic.myVote === -1 ? "text-red-400" : "text-muted-foreground"
            }`}
          >
            ▼
          </button>
          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
          <button
            type="button"
            onClick={handleFavorite}
            aria-label={topic.favorited ? "Remove favorite" : "Add favorite"}
            aria-pressed={topic.favorited}
            className={`rounded-full px-2 py-1 text-sm transition hover:bg-muted ${
              topic.favorited ? "text-amber-400" : "text-muted-foreground"
            }`}
          >
            {topic.favorited ? "★" : "☆"}
          </button>
        </div>

        <button
          type="button"
          onClick={practiceThis}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
        >
          Practice this
        </button>
      </div>
    </div>
  );
}
