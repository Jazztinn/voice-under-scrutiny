# Voice Under Scrutiny

A web app for practicing pitches and public speaking. The loop:

1. **Get a random topic** — from a curated pool of pitch / speaking prompts.
2. **Record your pitch** — straight from the mic in the browser.
3. **Listen back** — be your own critic before anyone else is.
4. **Transcribe** — OpenAI Whisper turns your audio into text.
5. **Log it** — every attempt is saved locally so you can track improvement.

No login. Pitches (audio + transcript) are stored **locally in your browser** via IndexedDB — nothing is uploaded except the audio sent for transcription.

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS
- `MediaRecorder` for mic capture, IndexedDB (`idb`) for local history
- `POST /api/transcribe` proxies to OpenAI Whisper (key stays server-side)

## Local development

```bash
cp .env.local.example .env.local   # add your OPENAI_API_KEY
npm install
npm run dev                        # http://localhost:3000
```

Recording needs microphone permission and a secure context (`localhost` or HTTPS).

## Deploy (Vercel)

Import the repo, set `OPENAI_API_KEY` in project env vars, deploy. Default Next.js build settings work.

> Note: Vercel Hobby caps request bodies at ~4.5MB. A 2–3 minute opus recording is ~1–2MB, well under the limit. For much longer recordings, switch to a direct-to-storage upload flow.

## Roadmap

- AI feedback on transcripts (clarity, structure, filler words, pacing) — the UI slot and `Pitch.feedback` field are already reserved.
