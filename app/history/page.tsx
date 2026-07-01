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
        <h1 className="text-2xl font-semibold text-neutral-100">Your pitch log</h1>
        {pitches && pitches.length > 0 && (
          <span className="text-sm text-neutral-500">
            {pitches.length} {pitches.length === 1 ? "pitch" : "pitches"}
          </span>
        )}
      </div>

      {pitches === null && <p className="text-neutral-500">Loading…</p>}

      {pitches && pitches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-10 text-center">
          <p className="text-neutral-400">No pitches yet.</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
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
              className="rounded-2xl border border-neutral-800 bg-neutral-900/60"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : p.id)}
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-100">
                    {p.topic}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatDate(p.createdAt)} · {formatDuration(p.durationSec)}
                    {p.transcript ? ` · ${wordCount(p.transcript)} words` : ""}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-neutral-500">
                  {open ? "▲" : "▼"}
                </span>
              </button>

              {open && (
                <div className="flex flex-col gap-4 border-t border-neutral-800 p-4">
                  <PitchPlayer blob={p.audioBlob} />
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Transcript
                    </p>
                    {p.transcript ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-neutral-200">
                        {p.transcript}
                      </p>
                    ) : (
                      <p className="text-sm text-neutral-500">
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
