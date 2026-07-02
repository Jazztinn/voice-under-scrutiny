"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { formatDuration } from "@/lib/format";

type Props = {
  blob: Blob;
  durationSec?: number;
  className?: string;
};

type PlayerControlsProps = {
  url: string;
  durationHint?: number;
  className?: string;
};

function PlayIcon({ paused }: { paused: boolean }) {
  if (!paused) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden>
        <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function SkipIcon({ direction }: { direction: "back" | "forward" }) {
  return (
    <span className="relative flex h-7 w-7 items-center justify-center" aria-hidden>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-7 w-7 ${direction === "forward" ? "scale-x-[-1]" : ""}`}
      >
        <path d="M8 7a6 6 0 1 1-1.4 6.2" />
        <path d="M8 7H4V3" />
      </svg>
      <span className="absolute text-[0.56rem] font-black leading-none">15</span>
    </span>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      {muted ? (
        <>
          <path d="M18 9l4 4" />
          <path d="M22 9l-4 4" />
        </>
      ) : (
        <>
          <path d="M16 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a9 9 0 0 1 0 12" />
        </>
      )}
    </svg>
  );
}

/**
 * Owns the object URL lifecycle for the recorded audio blob.
 */
export default function PitchPlayer({ blob, durationSec, className }: Props) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const nextUrl = URL.createObjectURL(blob);
    // This state mirrors an external object URL resource. Creating it in an
    // effect keeps Strict Mode cleanup from revoking a render-time URL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [blob]);

  if (!url) return null;

  return (
    <PlayerControls
      key={url}
      url={url}
      durationHint={durationSec}
      className={className}
    />
  );
}

/**
 * Custom audio playback for self-scrutiny.
 * The native browser control bar is intentionally replaced so playback matches
 * the app's purple visual system across browsers.
 */
function PlayerControls({ url, durationHint, className }: PlayerControlsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  }

  function skip(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const maxTime = duration || durationHint || audio.duration || 0;
    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), maxTime);
  }

  function seek(value: string) {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Number(value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function toggleMuted() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  const displayDuration = duration || durationHint || 0;
  const progress = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0;

  return (
    <div
      className={`btn-emboss flex w-full items-center gap-3 rounded-[1.35rem] bg-gradient-to-r from-violet-700 via-indigo-600 to-violet-500 px-4 py-3 text-white shadow-violet-950/20 ${className ?? ""}`}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const nextDuration = e.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onDurationChange={(e) => {
          const nextDuration = e.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onEnded={() => setPaused(true)}
      >
        Your browser does not support audio playback.
      </audio>

      <button
        type="button"
        onClick={() => skip(-15)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
        aria-label="Skip back 15 seconds"
      >
        <SkipIcon direction="back" />
      </button>

      <button
        type="button"
        onClick={togglePlayback}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/18 text-white transition hover:bg-white/25"
        aria-label={paused ? "Play recording" : "Pause recording"}
      >
        <PlayIcon paused={paused} />
      </button>

      <button
        type="button"
        onClick={() => skip(15)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
        aria-label="Skip forward 15 seconds"
      >
        <SkipIcon direction="forward" />
      </button>

      <span className="w-12 shrink-0 text-right font-mono text-sm font-bold tabular-nums">
        {formatDuration(currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={Math.max(displayDuration, 0)}
        step="0.01"
        value={Math.min(currentTime, displayDuration || 0)}
        onChange={(e) => seek(e.target.value)}
        className="vus-player-range min-w-0 flex-1"
        style={{ "--range-progress": `${progress}%` } as CSSProperties}
        aria-label="Playback position"
      />

      <span className="w-12 shrink-0 font-mono text-sm font-bold tabular-nums">
        {formatDuration(displayDuration)}
      </span>

      <button
        type="button"
        onClick={toggleMuted}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
        aria-label={muted ? "Unmute recording" : "Mute recording"}
      >
        <VolumeIcon muted={muted} />
      </button>
    </div>
  );
}
