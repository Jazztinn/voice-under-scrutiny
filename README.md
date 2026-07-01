# Voice Under Scrutiny

A web app for practicing pitches and public speaking. The loop:

1. **Get a random topic** — from a curated pool of pitch / speaking prompts.
2. **Record your pitch** — straight from the mic in the browser.
3. **Listen back** — be your own critic before anyone else is.
4. **Transcribe** — Groq Whisper turns your audio into text. If no Groq key is
   configured, it automatically falls back to **in-browser Whisper** (no key, runs
   fully on-device).
5. **Log it** — every attempt is saved locally so you can track improvement.

No login. Pitches (audio + transcript) are stored **locally in your browser** via IndexedDB — nothing is uploaded except the audio sent for transcription.

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS
- `MediaRecorder` for mic capture, IndexedDB (`idb`) for local history
- `POST /api/transcribe` proxies to Groq Whisper (key stays server-side)
- Fallback: `@huggingface/transformers` runs Whisper (`whisper-small.en`, WebGPU
  when available) in a Web Worker when Groq is unavailable — no key, no server,
  first run downloads the quantized model (~150MB, cached after)

## Local development

```bash
cp .env.local.example .env.local   # add your GROQ_API_KEY
npm install
npm run dev                        # http://localhost:3000
```

Recording needs microphone permission and a secure context (`localhost` or HTTPS).

## Deploy (Vercel)

Import the repo, set `GROQ_API_KEY` in project env vars, deploy. Default Next.js build settings work.

> Note: Vercel Hobby caps request bodies at ~4.5MB. A 2–3 minute opus recording is ~1–2MB, well under the limit. For much longer recordings, switch to a direct-to-storage upload flow.

## Roadmap

- AI feedback on transcripts (clarity, structure, filler words, pacing) — the UI slot and `Pitch.feedback` field are already reserved.
