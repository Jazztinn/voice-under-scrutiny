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

// Each strand is a closed loop around the button, displaced per-vertex by the
// live waveform + sine wobble, so loud moments visibly tangle the rings.
const STRANDS = [
  { band: "low" as const, base: 54, speed: 0.5, dir: 1, waves: 3, amp: 16, width: 2.6 },
  { band: "mid" as const, base: 58, speed: 1.0, dir: -1, waves: 5, amp: 12, width: 1.8 },
  { band: "high" as const, base: 61, speed: 1.6, dir: 1, waves: 7, amp: 9, width: 1.2 },
  { band: "level" as const, base: 56, speed: 0.3, dir: -1, waves: 2, amp: 20, width: 2.2 },
];

const VERTS = 160;

export default function Recorder({ onComplete, disabled }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live mic analysis → canvas waveform ring, drawn straight to the DOM each
  // frame (never through React state) so it stays at animation-frame smoothness.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothRef = useRef({ level: 0, low: 0, mid: 0, high: 0 });
  const ripplesRef = useRef<{ r: number; alpha: number }[]>([]);
  const lastRippleRef = useRef(0);

  const stopAudioAnalysis = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    ripplesRef.current = [];
    smoothRef.current = { level: 0, low: 0, mid: 0, high: 0 };
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
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    const freq = new Uint8Array(analyser.frequencyBinCount);
    const wave = new Uint8Array(analyser.fftSize);

    // Frequency bands tuned for speech (~47Hz per bin at 48kHz):
    // low ≈ 50–560Hz (fundamentals), mid ≈ 560Hz–3kHz (vowels/harmonics),
    // high ≈ 3–9kHz (consonants/sibilance).
    const band = (start: number, end: number) => {
      let sum = 0;
      for (let i = start; i < end; i++) sum += freq[i];
      return Math.min(1, (sum / (end - start) / 255) * 2.2);
    };

    const draw = (now: number) => {
      rafRef.current = requestAnimationFrame(draw);

      const canvas = canvasRef.current;
      const g = canvas?.getContext("2d");
      if (!canvas || !g) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(rect.width * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, rect.width, rect.height);

      analyser.getByteFrequencyData(freq);
      analyser.getByteTimeDomainData(wave);

      // Lerp-smooth the band energies so the rings breathe instead of jitter.
      const s = smoothRef.current;
      s.low += (band(1, 12) - s.low) * 0.25;
      s.mid += (band(12, 64) - s.mid) * 0.25;
      s.high += (band(64, 192) - s.high) * 0.25;
      s.level += (band(1, 192) - s.level) * 0.2;

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const t = now / 1000;
      const dark = document.documentElement.classList.contains("dark");
      const core = dark ? "#ffffff" : "#4338ca";

      // Soft breathing glow behind everything.
      const glow = g.createRadialGradient(cx, cy, 20, cx, cy, rect.width / 2);
      glow.addColorStop(0, `rgba(129, 140, 248, ${0.08 + s.level * 0.3})`);
      glow.addColorStop(1, "rgba(129, 140, 248, 0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, rect.width, rect.height);

      g.globalCompositeOperation = "lighter";

      // Ripples emitted on loud peaks.
      if (s.level > 0.28 && now - lastRippleRef.current > 320) {
        lastRippleRef.current = now;
        if (ripplesRef.current.length < 6) {
          ripplesRef.current.push({ r: 52, alpha: 0.45 });
        }
      }
      ripplesRef.current = ripplesRef.current.filter((rp) => rp.alpha > 0.02);
      for (const rp of ripplesRef.current) {
        g.beginPath();
        g.arc(cx, cy, rp.r, 0, Math.PI * 2);
        g.strokeStyle = `rgba(167, 139, 250, ${rp.alpha})`;
        g.lineWidth = 1.5;
        g.stroke();
        rp.r += 1.2 + s.level * 2.5;
        rp.alpha *= 0.93;
      }

      // The strands themselves.
      for (const st of STRANDS) {
        const energy = st.band === "level" ? s.level : s[st.band];
        const rot = t * st.speed * st.dir;
        const waveGain = 2 + energy * st.amp;
        const sampleShift = Math.floor(t * 90 * st.speed);

        g.beginPath();
        for (let i = 0; i <= VERTS; i++) {
          const j = i % VERTS; // wrap so the loop seals without a seam
          const theta = (j / VERTS) * Math.PI * 2 + rot;
          const w = (wave[(j * 5 + sampleShift) % wave.length] - 128) / 128;
          const wobble =
            Math.sin(theta * st.waves + t * 1.6 * st.speed) * (2 + energy * 5) +
            Math.sin(theta * (st.waves * 2 + 1) - t * 2.4 * st.speed) *
              (1 + energy * 3);
          const r = st.base + s.level * 6 + wobble + w * waveGain;
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * r;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.closePath();

        let stroke: CanvasGradient | string = "#818cf8";
        if (typeof g.createConicGradient === "function") {
          const cg = g.createConicGradient(rot * 2, cx, cy);
          cg.addColorStop(0, "#7c3aed");
          cg.addColorStop(0.25, core);
          cg.addColorStop(0.5, "#6366f1");
          cg.addColorStop(0.75, "#a78bfa");
          cg.addColorStop(1, "#7c3aed");
          stroke = cg;
        }
        g.strokeStyle = stroke;
        g.globalAlpha = Math.min(1, 0.3 + energy * 0.8);
        g.lineWidth = st.width + energy * 2;
        g.shadowColor = "rgba(139, 92, 246, 0.8)";
        g.shadowBlur = 10 + energy * 22;
        g.stroke();
      }
      g.globalAlpha = 1;
      g.shadowBlur = 0;
      g.globalCompositeOperation = "source-over";

      // Pulse the record button itself with overall loudness.
      wrapRef.current?.style.setProperty(
        "--btn-scale",
        (1 + s.level * 0.09).toFixed(4)
      );
    };
    rafRef.current = requestAnimationFrame(draw);
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
      <div ref={wrapRef} className="relative flex h-32 w-32 items-center justify-center">
        {isRecording && (
          <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none absolute -inset-14"
            style={{ width: "calc(100% + 7rem)", height: "calc(100% + 7rem)" }}
          />
        )}

        <button
          type="button"
          onClick={isRecording ? stop : start}
          disabled={disabled}
          style={{ transform: "scale(var(--btn-scale, 1))" }}
          className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
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
