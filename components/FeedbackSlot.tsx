"use client";
import { useState } from "react";

export type Feedback = { summary: string; clarity: number; structure: number; pacing: number; fillerWords: string[]; strengths: string[]; nextStep: string };

function normalizeFeedback(value: unknown): Feedback {
  const raw = value && typeof value === "object" ? value as Partial<Feedback> : {};
  const score = (input: unknown) => typeof input === "number" && Number.isFinite(input) ? Math.max(1, Math.min(10, Math.round(input))) : 5;
  const strings = (input: unknown) => Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : [];
  return {
    summary: typeof raw.summary === "string" ? raw.summary : "Your transcript has been reviewed.",
    clarity: score(raw.clarity),
    structure: score(raw.structure),
    pacing: score(raw.pacing),
    fillerWords: strings(raw.fillerWords),
    strengths: strings(raw.strengths),
    nextStep: typeof raw.nextStep === "string" ? raw.nextStep : "Try the answer once more with a clear opening and closing.",
  };
}

export default function FeedbackSlot({ transcript }: { transcript: string | null }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getFeedback() {
    if (!transcript) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate feedback.");
      setFeedback(normalizeFeedback(data.feedback));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not generate feedback."); }
    finally { setLoading(false); }
  }

  return (
    <div className="w-full rounded-3xl border border-dashed border-border bg-card/50 p-5 opacity-70">
      <div className="flex items-center justify-between">
        <span className="chip">AI Feedback</span>
        <button type="button" onClick={getFeedback} disabled={!transcript || loading} className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{loading ? "Reviewing…" : feedback ? "Review again" : "Get feedback"}</button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {feedback ? feedback.summary : transcript ? "Get a focused review of clarity, structure, filler words, and pacing." : "Transcribe your pitch first to unlock feedback."}
      </p>
      {feedback && <div className="mt-4 space-y-3 text-sm text-foreground/90"><div className="grid grid-cols-3 gap-2">{([["Clarity", feedback.clarity], ["Structure", feedback.structure], ["Pacing", feedback.pacing]] as const).map(([label, score]) => <div key={label} className="rounded-xl bg-muted p-2 text-center"><b>{score}/10</b><span className="block text-xs text-muted-foreground">{label}</span></div>)}</div><p><b>Strengths:</b> {feedback.strengths.join(" ")}</p><p><b>Next step:</b> {feedback.nextStep}</p>{feedback.fillerWords.length > 0 && <p><b>Filler words:</b> {feedback.fillerWords.join(", ")}</p>}</div>}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
