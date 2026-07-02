"use client";

import { useEffect, useState } from "react";
import Recorder, { type Recording } from "@/components/Recorder";
import PitchPlayer from "@/components/PitchPlayer";
import TopicCard from "@/components/TopicCard";
import TranscriptView from "@/components/TranscriptView";
import FeedbackSlot from "@/components/FeedbackSlot";
import { randomTopic } from "@/lib/topics";
import { addPitch, type Pitch } from "@/lib/db";
import { formatDuration } from "@/lib/format";
import { transcribeLocally } from "@/lib/localTranscribe";

type Source = "groq" | "in-browser" | null;

type Stage = "idle" | "recorded";

export default function PracticePage() {
  const [topic, setTopic] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [recording, setRecording] = useState<Recording | null>(null);

  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [source, setSource] = useState<Source>(null);

  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Pick an initial topic on mount (client-only to avoid hydration mismatch).
  // A community topic queued via "Practice this" takes priority over a random one.
  useEffect(() => {
    const queued = sessionStorage.getItem("queuedTopic");
    if (queued) {
      sessionStorage.removeItem("queuedTopic");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTopic(queued);
    } else {
      setTopic(randomTopic());
    }
  }, []);

  function newTopic() {
    setTopic((prev) => randomTopic(prev));
  }

  function reset() {
    setRecording(null);
    setTranscript(null);
    setTranscribeError(null);
    setStatusText(null);
    setSource(null);
    setSaved(false);
    setSaveError(null);
    setStage("idle");
  }

  function handleComplete(rec: Recording) {
    setRecording(rec);
    setTranscript(null);
    setTranscribeError(null);
    setStatusText(null);
    setSource(null);
    setSaved(false);
    setSaveError(null);
    setStage("recorded");
  }

  // Try Groq (server) first; if it's unavailable (no key / error), fall back to
  // in-browser Whisper so transcription always works.
  async function tryGroq(blob: Blob): Promise<string> {
    const form = new FormData();
    form.append("audio", blob, "pitch");
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Transcription failed.");
    return data.transcript ?? "";
  }

  async function transcribe() {
    if (!recording) return;
    setTranscribing(true);
    setTranscribeError(null);
    setStatusText("Transcribing with Groq…");
    try {
      const text = await tryGroq(recording.blob);
      setTranscript(text);
      setSource("groq");
    } catch {
      // Groq unavailable — fall back to in-browser Whisper.
      try {
        setStatusText("Groq unavailable — transcribing in your browser…");
        const text = await transcribeLocally(recording.blob, (s) => {
          if (s.stage === "loading-model") {
            setStatusText(
              `Downloading speech model (first run only)… ${s.progress}%`
            );
          } else {
            setStatusText("Transcribing in your browser…");
          }
        });
        setTranscript(text);
        setSource("in-browser");
      } catch (err) {
        setTranscribeError(
          err instanceof Error ? err.message : "Transcription failed."
        );
      }
    } finally {
      setTranscribing(false);
      setStatusText(null);
    }
  }

  async function save() {
    if (!recording) return;
    setSaveError(null);
    const pitch: Pitch = {
      id: crypto.randomUUID(),
      topic,
      audioBlob: recording.blob,
      mimeType: recording.mimeType,
      durationSec: recording.durationSec,
      transcript,
      feedback: null,
      createdAt: Date.now(),
    };
    try {
      await addPitch(pitch);
      setSaved(true);
    } catch {
      setSaveError("Could not save this pitch.");
    }
  }

  function nextRound() {
    newTopic();
    reset();
  }

  return (
    <main className="flex w-full flex-1 flex-col px-6 py-8">
      <div className="grid flex-1 gap-6 md:grid-cols-2 md:items-stretch">
        <TopicCard
          topic={topic || "…"}
          onNewTopic={newTopic}
          disabled={stage === "recorded"}
        />

        {stage === "idle" && (
          <section className="flex min-h-[26rem] flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card/60 px-6 py-14 shadow-sm md:min-h-[30rem]">
            <Recorder onComplete={handleComplete} />
          </section>
        )}

        {stage === "recorded" && recording && (
          <section className="flex flex-col gap-5">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="chip">Listen back</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {formatDuration(recording.durationSec)}
                </span>
              </div>
              <PitchPlayer blob={recording.blob} />
            </div>

            <TranscriptView
              transcript={transcript}
              loading={transcribing}
              error={transcribeError}
              statusText={statusText}
              source={source}
            />

            <FeedbackSlot />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={transcribe}
                disabled={transcribing}
                className="rounded-full bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {transcript ? "Re-transcribe" : "Transcribe"}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saved}
                className="rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {saved ? "Saved ✓" : "Save to log"}
              </button>
              <button
                type="button"
                onClick={nextRound}
                className="rounded-full border border-border px-6 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
              >
                {saved ? "Next topic" : "Discard"}
              </button>
            </div>
            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
