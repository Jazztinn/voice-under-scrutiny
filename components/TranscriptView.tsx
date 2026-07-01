"use client";

import { wordCount } from "@/lib/format";

type Props = {
  transcript: string | null;
  loading?: boolean;
  error?: string | null;
};

export default function TranscriptView({ transcript, loading, error }: Props) {
  return (
    <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Transcript
        </span>
        {transcript && (
          <span className="text-xs text-neutral-500">
            {wordCount(transcript)} words
          </span>
        )}
      </div>

      <div className="mt-3 text-neutral-200">
        {loading && <p className="text-neutral-400">Transcribing…</p>}
        {!loading && error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && transcript && (
          <p className="whitespace-pre-wrap leading-relaxed">{transcript}</p>
        )}
        {!loading && !error && !transcript && (
          <p className="text-sm text-neutral-500">
            Not transcribed yet.
          </p>
        )}
      </div>
    </div>
  );
}
