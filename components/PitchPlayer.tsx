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
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
        <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 translate-x-0.5" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function SkipIcon({ direction }: { direction: "back" | "forward" }) {
  const back = direction === "back";

  return (
    <span className="flex items-center gap-0.5 font-mono text-xs font-black leading-none" aria-hidden>
      {back && <span className="text-base leading-none">‹</span>}
      <span>15</span>
      {!back && <span className="text-base leading-none">›</span>}
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
  const [playError, setPlayError] = useState<string | null>(null);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        setPlayError(null);
        audio.muted = false;
        audio.volume = 1;
        setMuted(false);
        await audio.play();
      } catch {
        setPlayError("Could not play this recording. Try recording again.");
      }
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
    <div className={`flex w-full flex-col gap-2 ${className ?? ""}`}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        playsInline
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
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        onError={() => setPlayError("Could not load this recording. Try recording again.")}
      >
        Your browser does not support audio playback.
      </audio>

      <div
        className="btn-emboss flex w-full items-center gap-4 rounded-[1.35rem] bg-gradient-to-r from-violet-700 via-indigo-600 to-violet-500 px-5 py-4 text-white shadow-violet-950/20"
      >
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/12 p-1.5">
          <button
            type="button"
            onClick={() => skip(-15)}
            className="grid h-10 w-10 place-items-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
            aria-label="Skip back 15 seconds"
          >
            <SkipIcon direction="back" />
          </button>

          <button
            type="button"
            onClick={togglePlayback}
            className="grid h-16 w-16 place-items-center rounded-full bg-white/18 text-white transition hover:bg-white/25"
            aria-label={paused ? "Play recording" : "Pause recording"}
          >
            <PlayIcon paused={paused} />
          </button>

          <button
            type="button"
            onClick={() => skip(15)}
            className="grid h-10 w-10 place-items-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
            aria-label="Skip forward 15 seconds"
          >
            <SkipIcon direction="forward" />
          </button>
        </div>

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
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
          aria-label={muted ? "Unmute recording" : "Mute recording"}
        >
          <VolumeIcon muted={muted} />
        </button>
      </div>

      {playError && <p className="px-2 text-sm text-red-400">{playError}</p>}
    </div>
  );
}
