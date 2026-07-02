"use client";

import { useEffect, useState } from "react";
import Recorder, { type Recording } from "@/components/Recorder";
import PitchPlayer from "@/components/PitchPlayer";
import TopicCard from "@/components/TopicCard";
import TranscriptView from "@/components/TranscriptView";
import FeedbackSlot from "@/components/FeedbackSlot";
import { randomTopic, type Topic } from "@/lib/topics";
import { addPitch, type Pitch } from "@/lib/db";
import { formatDuration } from "@/lib/format";
import { transcribeLocally } from "@/lib/localTranscribe";

type Source = "groq" | "in-browser" | null;

type Stage = "idle" | "recorded";

type QueuedTopic = Topic;

type GeneratedTopicResponse = {
  topic?: Topic;
  error?: string;
};

function PracticeSkeleton() {
  return (
    <main className="flex w-full flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <div className="grid flex-1 gap-4 md:grid-cols-2 md:items-stretch md:gap-6">
        <section className="h-full w-full overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="flex items-center justify-between">
            <div className="skeleton-shimmer h-8 w-32 rounded-full" />
            <div className="skeleton-shimmer h-5 w-24 rounded-full" />
          </div>
          <div className="mt-8 space-y-4">
            <div className="skeleton-shimmer h-9 w-11/12 rounded-full" />
            <div className="skeleton-shimmer h-9 w-8/12 rounded-full" />
          </div>
          <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-4 sm:mt-10">
            <div className="skeleton-shimmer h-6 w-24 rounded-full" />
            <div className="mt-3 space-y-2">
              <div className="skeleton-shimmer h-3.5 w-full rounded-full" />
              <div className="skeleton-shimmer h-3.5 w-10/12 rounded-full" />
              <div className="skeleton-shimmer h-3.5 w-7/12 rounded-full" />
            </div>
          </div>
        </section>

        <section className="flex min-h-[20rem] flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-card/60 px-4 py-8 shadow-sm sm:rounded-3xl sm:px-6 sm:py-14 md:min-h-[30rem]">
          <div className="skeleton-shimmer h-32 w-32 rounded-full" />
          <div className="skeleton-shimmer h-10 w-24 rounded-full" />
        </section>
      </div>
    </main>
  );
}

function parseQueuedTopic(raw: string): QueuedTopic {
  try {
    const parsed = JSON.parse(raw) as Partial<Topic>;
    if (
      typeof parsed.prompt === "string" &&
      typeof parsed.scenario === "string" &&
      Array.isArray(parsed.cases) &&
      parsed.cases.every((item) => typeof item === "string")
    ) {
      return {
        prompt: parsed.prompt,
        scenario: parsed.scenario,
        cases: parsed.cases,
      };
    }
  } catch {
    // Older queued topics were stored as the prompt string only.
  }

  return { prompt: raw, scenario: "", cases: [] };
}

export default function PracticePage() {
  const [topic, setTopic] = useState("");
  const [topicDetail, setTopicDetail] = useState<Topic | null>(null);
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
      const parsed = parseQueuedTopic(queued);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTopic(parsed.prompt);
      setTopicDetail(parsed.scenario ? parsed : null);
    } else {
      setTopic(randomTopic());
    }
  }, []);

  function newTopic() {
    setTopicDetail(null);
    setTopic((prev) => randomTopic(prev));
  }

  async function generateTopic(seed: string) {
    const res = await fetch("/api/topics/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seed }),
    });
    const data = (await res.json()) as GeneratedTopicResponse;
    if (!res.ok || !data.topic) {
      throw new Error(data.error ?? "Could not generate a topic.");
    }
    setTopic(data.topic.prompt);
    setTopicDetail(data.topic);
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

  if (!topic) {
    return <PracticeSkeleton />;
  }

  return (
    <main className="flex w-full flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <div className="grid flex-1 gap-4 md:grid-cols-2 md:items-stretch md:gap-6">
        <TopicCard
          topic={topic || "…"}
          detail={topicDetail}
          onNewTopic={newTopic}
          onGenerateTopic={generateTopic}
          disabled={stage === "recorded"}
        />

        {stage === "idle" && (
          <section className="flex min-h-[20rem] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card/60 px-4 py-8 shadow-sm sm:rounded-3xl sm:px-6 sm:py-14 md:min-h-[30rem]">
            <Recorder onComplete={handleComplete} />
          </section>
        )}

        {stage === "recorded" && recording && (
          <section className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:rounded-3xl sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="chip">Listen back</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {formatDuration(recording.durationSec)}
                </span>
              </div>
              <PitchPlayer blob={recording.blob} durationSec={recording.durationSec} />
            </div>

            <TranscriptView
              transcript={transcript}
              loading={transcribing}
              error={transcribeError}
              statusText={statusText}
              source={source}
            />

            <FeedbackSlot />

            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={transcribe}
                disabled={transcribing}
                className="btn-emboss rounded-full bg-accent px-6 py-3 text-base font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
              >
                {transcript ? "Re-transcribe" : "Transcribe"}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saved}
                className="btn-emboss rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {saved ? "Saved ✓" : "Save to log"}
              </button>
              <button
                type="button"
                onClick={nextRound}
                className="btn-emboss-outline rounded-full border border-border bg-card px-6 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
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
