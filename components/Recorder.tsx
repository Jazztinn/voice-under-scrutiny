"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/format";

export type Recording = {
  blob: Blob;
  mimeType: string;
  durationSec: number;
};

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  if (typeof MediaRecorder === "undefined") return "";
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

type Props = {
  onComplete: (rec: Recording) => void;
  disabled?: boolean;
};

export default function Recorder({ onComplete, disabled }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    if (typeof MediaRecorder === "undefined") {
      setError("Recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const durationSec = (Date.now() - startedAtRef.current) / 1000;
        cleanup();
        setIsRecording(false);
        if (blob.size > 0) {
          onComplete({ blob, mimeType: type, durationSec });
        } else {
          setError("No audio captured. Try again.");
        }
      };

      recorder.start();
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startedAtRef.current) / 1000);
      }, 200);
    } catch (err) {
      cleanup();
      setIsRecording(false);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Allow it in your browser and retry.");
      } else {
        setError("Could not start recording. Check your microphone.");
      }
    }
  }, [cleanup, onComplete]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={isRecording ? stop : start}
        disabled={disabled}
        className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
          isRecording
            ? "bg-red-600 hover:bg-red-500 animate-pulse"
            : "bg-indigo-600 hover:bg-indigo-500"
        }`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <span className="h-6 w-6 rounded-sm bg-white" />
        ) : (
          <span className="h-7 w-7 rounded-full bg-white" />
        )}
      </button>

      <div className="font-mono text-lg tabular-nums text-neutral-300">
        {formatDuration(elapsed)}
      </div>
      <p className="text-sm text-neutral-400">
        {isRecording ? "Recording… tap to stop" : "Tap to record your pitch"}
      </p>

      {error && (
        <p className="max-w-sm text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
