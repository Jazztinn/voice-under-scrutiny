"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PitchPlayer from "@/components/PitchPlayer";
import { getAllPitches, deletePitch, type Pitch } from "@/lib/db";
import { formatDate, formatDuration, wordCount } from "@/lib/format";

export default function HistoryPage() {
  const [pitches, setPitches] = useState<Pitch[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    getAllPitches()
      .then(setPitches)
      .catch(() => setPitches([]));
  }, []);

  async function remove(id: string) {
    await deletePitch(id);
    setPitches((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    if (openId === id) setOpenId(null);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Your pitch log</h1>
        {pitches && pitches.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {pitches.length} {pitches.length === 1 ? "pitch" : "pitches"}
          </span>
        )}
      </div>

      {pitches === null && <p className="text-muted-foreground">Loading…</p>}

      {pitches && pitches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">No pitches yet.</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover"
          >
            Record your first pitch
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {pitches?.map((p) => {
          const open = openId === p.id;
          return (
            <li
              key={p.id}
              className="rounded-2xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : p.id)}
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {p.topic}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(p.createdAt)} · {formatDuration(p.durationSec)}
                    {p.transcript ? ` · ${wordCount(p.transcript)} words` : ""}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-muted-foreground">
                  {open ? "▲" : "▼"}
                </span>
              </button>

              {open && (
                <div className="flex flex-col gap-4 border-t border-border p-4">
                  <PitchPlayer blob={p.audioBlob} />
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Transcript
                    </p>
                    {p.transcript ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                        {p.transcript}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not transcribed.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="self-start rounded-lg border border-red-900/50 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-950/40"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
