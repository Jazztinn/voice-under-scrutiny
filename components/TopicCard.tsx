"use client";

import { useEffect, useRef, useState } from "react";
import { TOPICS, topicDetail } from "@/lib/topics";

type Props = {
  topic: string;
  onNewTopic: () => void;
  disabled?: boolean;
};

// How long the slot-machine roll lasts and how fast it flips.
const ROLL_MS = 650;
const FLIP_MS = 55;

export default function TopicCard({ topic, onNewTopic, disabled }: Props) {
  // `display` is what the card shows: real topic when idle, random flashes while rolling.
  const [display, setDisplay] = useState(topic);
  const [rolling, setRolling] = useState(false);
  const [open, setOpen] = useState(false);
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detail = topicDetail(topic);

  // Settle on the real topic once the parent hands us a new one and the roll ends.
  useEffect(() => {
    if (!rolling) setDisplay(topic);
  }, [topic, rolling]);

  useEffect(() => {
    return () => {
      if (rollTimer.current) clearInterval(rollTimer.current);
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  function handleNewTopic() {
    if (rolling || disabled) return;
    setOpen(false);
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

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Your topic
        </span>
        <button
          type="button"
          onClick={handleNewTopic}
          disabled={disabled || rolling}
          className="rounded-lg px-2 py-1 text-sm text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className={`inline-block ${rolling ? "animate-spin" : ""}`}>↻</span>{" "}
          New topic
        </button>
      </div>

      <p
        className={`mt-3 text-xl font-medium leading-snug text-neutral-100 transition-all duration-200 ${
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
            className="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
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
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Scenario
                </p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-300">
                  {detail.scenario}
                </p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Try these angles
                </p>
                <ul className="mt-2 space-y-1.5">
                  {detail.cases.map((c) => (
                    <li
                      key={c}
                      className="flex gap-2 text-sm leading-relaxed text-neutral-300"
                    >
                      <span className="mt-0.5 text-indigo-400">→</span>
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
