// Client-side driver for the in-browser Whisper worker. Decodes the recorded
// blob to mono 16kHz PCM, hands it to the worker, and streams status back.

export type LocalStatus =
  | { stage: "loading-model"; progress: number } // 0–100
  | { stage: "transcribing" };

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./whisper.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return worker;
}

async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const arrayBuf = await blob.arrayBuffer();
  const AC: typeof AudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AC({ sampleRate: 16000 });
  try {
    const decoded = await ctx.decodeAudioData(arrayBuf);
    if (decoded.numberOfChannels === 1) {
      return decoded.getChannelData(0).slice();
    }
    // Mix down to mono.
    const a = decoded.getChannelData(0);
    const b = decoded.getChannelData(1);
    const mono = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) mono[i] = (a[i] + b[i]) / 2;
    return mono;
  } finally {
    ctx.close();
  }
}

export async function transcribeLocally(
  blob: Blob,
  onStatus?: (s: LocalStatus) => void
): Promise<string> {
  const samples = await decodeToMono16k(blob);
  const w = getWorker();

  return new Promise<string>((resolve, reject) => {
    const perFile: Record<string, number> = {};

    const handler = (e: MessageEvent) => {
      const d = e.data as
        | { type: "progress"; file: string; progress: number }
        | { type: "status"; status: string }
        | { type: "result"; text: string }
        | { type: "error"; error: string };

      if (d.type === "progress") {
        perFile[d.file] = d.progress;
        const vals = Object.values(perFile);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        onStatus?.({ stage: "loading-model", progress: Math.round(avg) });
      } else if (d.type === "status" && d.status === "transcribing") {
        onStatus?.({ stage: "transcribing" });
      } else if (d.type === "result") {
        w.removeEventListener("message", handler);
        resolve((d.text ?? "").trim());
      } else if (d.type === "error") {
        w.removeEventListener("message", handler);
        reject(new Error(d.error));
      }
    };

    w.addEventListener("message", handler);
    // Transfer the sample buffer to avoid a copy.
    w.postMessage({ samples }, [samples.buffer]);
  });
}
