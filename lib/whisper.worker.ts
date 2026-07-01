// In-browser Whisper via transformers.js, run in a Web Worker so model download
// and inference never block the UI. Used as a fallback when the Groq route is
// unavailable (no server key). Receives mono 16kHz Float32 samples, posts back
// progress, then the transcript.
import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

// Always fetch models from the HF hub (no local model files bundled).
env.allowLocalModels = false;

const MODEL = "Xenova/whisper-tiny.en";

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;

self.onmessage = async (e: MessageEvent<{ samples: Float32Array }>) => {
  const { samples } = e.data;
  try {
    if (!transcriber) {
      transcriber = (await pipeline("automatic-speech-recognition", MODEL, {
        progress_callback: (p: { status: string; file?: string; progress?: number }) => {
          if (p.status === "progress") {
            self.postMessage({ type: "progress", file: p.file, progress: p.progress ?? 0 });
          }
        },
      })) as AutomaticSpeechRecognitionPipeline;
    }

    self.postMessage({ type: "status", status: "transcribing" });

    const out = await transcriber(samples, {
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
