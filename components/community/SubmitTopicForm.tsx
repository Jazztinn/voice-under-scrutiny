"use client";

import { useState } from "react";
import { submitCommunityTopic, type NewCommunityTopic } from "@/lib/community";

type Props = {
  open: boolean;
  deviceId: string;
  onClose: () => void;
  onSubmitted: (topic: NewCommunityTopic) => void;
};

export default function SubmitTopicForm({ open, deviceId, onClose, onSubmitted }: Props) {
  const [prompt, setPrompt] = useState("");
  const [scenario, setScenario] = useState("");
  const [cases, setCases] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function updateCase(i: number, value: string) {
    setCases((prev) => prev.map((c, idx) => (idx === i ? value : c)));
  }

  function addCase() {
    if (cases.length < 6) setCases((prev) => [...prev, ""]);
  }

  function removeCase(i: number) {
    setCases((prev) => prev.filter((_, idx) => idx !== i));
  }

  function reset() {
    setPrompt("");
    setScenario("");
    setCases([""]);
    setError(null);
  }

  async function submit() {
    if (!prompt.trim() || !scenario.trim()) {
      setError("Prompt and scenario are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const topic = await submitCommunityTopic({
        prompt: prompt.trim(),
        scenario: scenario.trim(),
        cases: cases.map((c) => c.trim()).filter(Boolean),
        deviceId,
      });
      onSubmitted(topic);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit topic.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold text-foreground">Submit a topic</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Give it a prompt, the scenario a speaker faces, and a few angles to try.
        </p>

        <label className="mt-5 block">
          <span className="chip">Prompt</span>
        </label>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={500}
          placeholder="Pitch a subscription box for something that's never had one."
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />

        <label className="mt-4 block">
          <span className="chip">Scenario</span>
        </label>
        <textarea
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Who's the audience, what's the setup?"
          className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />

        <label className="mt-4 block">
          <span className="chip">Try these angles (optional)</span>
        </label>
        <div className="mt-1.5 flex flex-col gap-2">
          {cases.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={c}
                onChange={(e) => updateCase(i, e.target.value)}
                maxLength={200}
                placeholder="A concrete angle to try"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
              {cases.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCase(i)}
                  aria-label="Remove angle"
                  className="shrink-0 rounded-lg px-2 py-1 text-muted-foreground transition hover:bg-muted"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {cases.length < 6 && (
            <button
              type="button"
              onClick={addCase}
              className="self-start text-sm font-medium text-accent transition hover:text-accent-hover"
            >
              + Add another angle
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit topic"}
          </button>
        </div>
      </div>
    </div>
  );
}
