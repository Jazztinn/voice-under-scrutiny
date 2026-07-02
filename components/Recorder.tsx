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

  // Live mic level → drives the reactive ring via CSS custom properties,
  // updated directly on the DOM each frame (not React state) to stay smooth.
  const ringRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopAudioAnalysis = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    const AudioCtxCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtxCtor) return;

    const ctx = new AudioCtxCtor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const band = (start: number, end: number) => {
      let sum = 0;
      for (let i = start; i < end; i++) sum += data[i];
      return sum / (end - start) / 255;
    };

    const loop = () => {
      analyser.getByteFrequencyData(data);
      const third = Math.floor(data.length / 3);
      const level = band(0, data.length);
      const low = band(0, third);
      const mid = band(third, third * 2);
      const high = band(third * 2, data.length);

      const el = ringRef.current;
      if (el) {
        el.style.setProperty("--level", level.toFixed(3));
        el.style.setProperty("--low", low.toFixed(3));
        el.style.setProperty("--mid", mid.toFixed(3));
        el.style.setProperty("--high", high.toFixed(3));
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopAudioAnalysis();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, [stopAudioAnalysis]);

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
      startAudioAnalysis(stream);
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
  }, [cleanup, onComplete, startAudioAnalysis]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-32 w-32 items-center justify-center">
        {isRecording && (
          <div
            ref={ringRef}
            className="pointer-events-none absolute inset-0"
            style={
              {
                "--level": 0,
                "--low": 0,
                "--mid": 0,
                "--high": 0,
              } as React.CSSProperties
            }
          >
            <div
              className="absolute inset-0 rounded-full opacity-70 blur-md"
              style={{
                background:
                  "conic-gradient(from 0deg, #a78bfa, #ffffff, #6366f1, #a78bfa)",
                transform: "scale(calc(1 + var(--low) * 0.5))",
                animation: "spin 6s linear infinite",
              }}
            />
            <div
              className="absolute inset-0 rounded-full opacity-60 blur-sm"
              style={{
                background: "conic-gradient(from 90deg, #ffffff, #818cf8, #ffffff)",
                transform: "scale(calc(1 + var(--mid) * 0.35))",
                animation: "spin 4s linear infinite reverse",
              }}
            />
            <div
              className="absolute inset-0 rounded-full opacity-50 blur-[2px]"
              style={{
                background: "conic-gradient(from 180deg, #c4b5fd, #ffffff, #c4b5fd)",
                transform: "scale(calc(1 + var(--high) * 0.25))",
                animation: "spin 3s linear infinite",
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={isRecording ? stop : start}
          disabled={disabled}
          className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
            isRecording
              ? "bg-red-600 hover:bg-red-500"
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
      </div>

      <div className="font-mono text-lg tabular-nums text-foreground/80">
        {formatDuration(elapsed)}
      </div>
      <p className="text-sm text-muted-foreground">
        {isRecording ? "Recording… tap to stop" : "Tap to record your pitch"}
      </p>

      {error && (
        <p className="max-w-sm text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
