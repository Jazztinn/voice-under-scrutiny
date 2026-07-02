"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { TOPICS, topicDetail } from "@/lib/topics";
import type { Topic } from "@/lib/topics";

type Props = {
  topic: string;
  detail?: Topic | null;
  onNewTopic: () => void;
  onGenerateTopic?: (seed: string) => Promise<void>;
  disabled?: boolean;
};

// How long the slot-machine roll lasts and how fast it flips.
const ROLL_MS = 650;
const FLIP_MS = 55;

export default function TopicCard({
  topic,
  detail: detailOverride,
  onNewTopic,
  onGenerateTopic,
  disabled,
}: Props) {
  // `display` is what the card shows: real topic when idle, random flashes while rolling.
  const [display, setDisplay] = useState(topic);
  const [rolling, setRolling] = useState(false);
  const [open, setOpen] = useState(true);
  const [seed, setSeed] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detail = detailOverride ?? topicDetail(topic);

  // Settle on the real topic once the parent hands us a new one and the roll ends.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!rolling) setDisplay(topic);
  }, [topic, rolling]);

  useEffect(() => {
    return () => {
      if (rollTimer.current) clearInterval(rollTimer.current);
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  function handleNewTopic() {
    if (rolling || generating || disabled) return;
    setGenerateError(null);
    setOpen(true);
    setRolling(true);
    // Flash random topics for a quick slot-machine spin.
    rollTimer.current = setInterval(() => {
      setDisplay(TOPICS[Math.floor(Math.random() * TOPICS.length)].prompt);
    }, FLIP_MS);
    stopTimer.current = setTimeout(() => {
      if (rollTimer.current) clearInterval(rollTimer.current);
      setRolling(false);
    }, ROLL_MS);
    // Ask the parent for the real next topic; it lands when the roll stops.
    onNewTopic();
  }

  async function handleGenerateTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onGenerateTopic || rolling || generating || disabled) return;

    const trimmed = seed.trim();
    if (!trimmed) {
      setGenerateError("Type a seed prompt first.");
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    setOpen(true);
    try {
      await onGenerateTopic(trimmed);
      setSeed("");
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Could not generate a topic."
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="chip">Your topic</span>
        <button
          type="button"
          onClick={handleNewTopic}
          disabled={disabled || rolling || generating}
          className="rounded-lg px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className={`inline-block ${rolling ? "animate-spin" : ""}`}>↻</span>{" "}
          New topic
        </button>
      </div>

      {onGenerateTopic && (
        <form onSubmit={handleGenerateTopic} className="mt-5">
          <label htmlFor="topic-seed" className="chip">
            Make a topic
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="topic-seed"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              disabled={disabled || rolling || generating}
              maxLength={500}
              placeholder="Negotiating a raise, explaining quantum physics, wedding toast..."
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={disabled || rolling || generating}
              className="btn-emboss rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
          {generateError && (
            <p className="mt-2 text-sm text-red-400">{generateError}</p>
          )}
        </form>
      )}

      <p
        className={`mt-3 text-xl font-medium leading-snug text-foreground transition-all duration-200 ${
          rolling
            ? "translate-y-0.5 opacity-60 blur-[1px]"
            : "translate-y-0 opacity-100 blur-0"
        }`}
      >
        {display}
      </p>

      {detail && !rolling && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-4 flex items-center gap-1.5 text-sm font-medium text-accent transition hover:text-accent-hover"
          >
            <span
              className={`inline-block transition-transform duration-200 ${
                open ? "rotate-90" : ""
              }`}
            >
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
                  {detail.scenario}
                </p>

                <p className="mt-4">
                  <span className="chip">Try these angles</span>
                </p>
                <ul className="mt-2 space-y-1.5">
                  {detail.cases.map((c) => (
                    <li
                      key={c}
                      className="flex gap-2 text-sm leading-relaxed text-foreground/80"
                    >
                      <span className="mt-0.5 text-accent">→</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
