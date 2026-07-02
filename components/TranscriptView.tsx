"use client";

import { wordCount } from "@/lib/format";

type Props = {
  transcript: string | null;
  loading?: boolean;
  error?: string | null;
  statusText?: string | null;
  source?: "groq" | "in-browser" | null;
};

export default function TranscriptView({
  transcript,
  loading,
  error,
  statusText,
  source,
}: Props) {
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Transcript
        </span>
        <div className="flex items-center gap-2">
          {!loading && transcript && source && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {source === "groq" ? "Groq" : "In-browser"}
            </span>
          )}
          {transcript && (
            <span className="text-xs text-muted-foreground">
              {wordCount(transcript)} words
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 text-foreground/90">
        {loading && (
          <p className="text-muted-foreground">{statusText ?? "Transcribing…"}</p>
        )}
        {!loading && error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && transcript && (
          <p className="whitespace-pre-wrap leading-relaxed">{transcript}</p>
        )}
        {!loading && !error && !transcript && (
          <p className="text-sm text-muted-foreground">Not transcribed yet.</p>
        )}
      </div>
    </div>
  );
}
