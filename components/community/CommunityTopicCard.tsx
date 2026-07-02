"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  relativeTime,
  toggleFavorite,
  voteOnTopic,
  type CommunityTopic,
} from "@/lib/community";
import { useEnsureUsername } from "@/components/UsernamePrompt";
import UsernamePrompt from "@/components/UsernamePrompt";

type Props = {
  topic: CommunityTopic;
  deviceId: string;
};

export default function CommunityTopicCard({ topic: initial, deviceId }: Props) {
  const router = useRouter();
  const [topic, setTopic] = useState(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { ensureUsername, promptProps } = useEnsureUsername();

  async function handleVote(value: 1 | -1) {
    if (busy) return;
    setBusy(true);
    await ensureUsername();
    const prevVote = topic.myVote;
    try {
      const { myVote } = await voteOnTopic(topic.id, deviceId, value);
      setTopic((t) => {
        let upvotes = t.upvotes;
        let downvotes = t.downvotes;
        if (prevVote === 1) upvotes -= 1;
        if (prevVote === -1) downvotes -= 1;
        if (myVote === 1) upvotes += 1;
        if (myVote === -1) downvotes += 1;
        return { ...t, myVote, upvotes, downvotes, score: upvotes - downvotes };
      });
    } catch {
      // Leave state as-is; a stale count beats a broken UI here.
    } finally {
      setBusy(false);
    }
  }

  async function handleFavorite() {
    if (busy) return;
    setBusy(true);
    await ensureUsername();
    try {
      const { favorited } = await toggleFavorite(topic.id, deviceId);
      setTopic((t) => ({
        ...t,
        favorited,
        favorite_count: t.favorite_count + (favorited ? 1 : -1),
      }));
    } catch {
      // no-op
    } finally {
      setBusy(false);
    }
  }

  function practiceThis() {
    sessionStorage.setItem("queuedTopic", topic.prompt);
    router.push("/");
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-medium leading-snug text-foreground">
          {topic.prompt}
        </p>
        <button
          type="button"
          onClick={handleFavorite}
          aria-label={topic.favorited ? "Remove favorite" : "Add favorite"}
          aria-pressed={topic.favorited}
          className={`shrink-0 rounded-full p-1.5 text-lg transition hover:bg-muted ${
            topic.favorited ? "text-amber-400" : "text-muted-foreground"
          }`}
        >
          {topic.favorited ? "★" : "☆"}
        </button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        by <span className="font-medium text-foreground/80">{topic.author_username}</span>{" "}
        · {relativeTime(topic.created_at)}
      </p>

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
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Scenario
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
              {topic.scenario}
            </p>
            {topic.cases.length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Try these angles
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
        </div>

        <button
          type="button"
          onClick={practiceThis}
          className="rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover"
        >
          Practice this
        </button>
      </div>

      <UsernamePrompt {...promptProps} />
    </div>
  );
}
