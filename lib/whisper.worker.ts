// In-browser Whisper via transformers.js, run in a Web Worker so model download
// and inference never block the UI. Used as a fallback when the Groq route is
// unavailable (no server key). Receives mono 16kHz Float32 samples, posts back
// progress, then the transcript.
import {
  pipeline,
  env,
  type AutomaticSpeechRecognitionPipeline,
  type ProgressInfo,
} from "@huggingface/transformers";

// Always fetch models from the HF hub (no local model files bundled).
env.allowLocalModels = false;

// small.en is far more accurate than tiny while still browser-friendly.
const MODEL = "Xenova/whisper-small.en";

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;

function progress_callback(p: ProgressInfo) {
  if (p.status === "progress") {
    self.postMessage({ type: "progress", file: p.file, progress: p.progress ?? 0 });
  }
}

async function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (transcriber) return transcriber;

  const hasGPU =
    typeof navigator !== "undefined" && "gpu" in navigator && !!navigator.gpu;

  try {
    transcriber = (await pipeline("automatic-speech-recognition", MODEL, {
      device: hasGPU ? "webgpu" : "wasm",
      dtype: "q8", // quantized: smaller download, faster inference
      progress_callback,
    })) as AutomaticSpeechRecognitionPipeline;
  } catch {
    // WebGPU can fail on some machines — retry on wasm.
    transcriber = (await pipeline("automatic-speech-recognition", MODEL, {
      device: "wasm",
      dtype: "q8",
      progress_callback,
    })) as AutomaticSpeechRecognitionPipeline;
  }
  return transcriber;
}

self.onmessage = async (e: MessageEvent<{ samples: Float32Array }>) => {
  const { samples } = e.data;
  try {
    const asr = await getTranscriber();

    self.postMessage({ type: "status", status: "transcribing" });

    const out = await asr(samples, {
      chunk_length_s: 30,
      stride_length_s: 5,
    });

    const text = Array.isArray(out)
      ? out.map((o) => o.text).join(" ")
      : out.text;
    self.postMessage({ type: "result", text });
  } catch (err) {
    self.postMessage({
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
