# Voice Under Scrutiny

A web app for practicing pitches and public speaking. The loop:

1. **Get a topic** — from a curated pool, or from the community board.
2. **Record your pitch** — straight from the mic, with a live audio-reactive ring.
3. **Listen back** — be your own critic before anyone else is.
4. **Transcribe** — Groq Whisper turns your audio into text. If no Groq key is
   configured, it automatically falls back to **in-browser Whisper** (no key,
   runs fully on-device).
5. **Log it** — every attempt is saved locally so you can track improvement.

No login. Pitches (audio + transcript) are stored **locally in your browser**
via IndexedDB — nothing is uploaded except the audio sent for transcription.

## Community topics

Anyone can submit practice topics, upvote/downvote them, and star favorites —
no account needed. Identity is an anonymous per-browser device ID stored in
localStorage; submissions are attributed to "Anonymous".

Backed by Supabase (Postgres + RLS):

- Row Level Security allows the anon role to read everything, insert topics,
  and insert/update/delete votes and favorites. Unique constraints enforce one
  vote and one favorite per device per topic.
- The anon key stays server-side (used only inside `/api/community/*` route
  handlers), matching how the Groq key is handled.
- Rate limits (enforced in the API routes): 5 topics / 10 min per device with
  a global brake of 30 topics / min, and 30 votes or favorites / min per
  device. Device IDs are self-reported, so this deters casual abuse rather
  than determined attackers — escalate to a WAF if needed.

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS v4
- `MediaRecorder` for mic capture, Web Audio `AnalyserNode` driving a canvas
  waveform ring while recording, IndexedDB (`idb`) for local history
- Supabase (Postgres + RLS) for community topics, votes, and favorites
- `POST /api/transcribe` proxies to Groq Whisper (key stays server-side)
- Fallback: `@huggingface/transformers` runs Whisper (`whisper-small.en`,
  WebGPU when available) in a Web Worker when Groq is unavailable — no key, no
  server; first run downloads the quantized model (~150MB, cached after)
- Manual light/dark theme (class-based) with a no-flash inline init script

## Local development

```bash
cp .env.local.example .env.local   # fill in the keys below
npm install
npm run dev                        # http://localhost:3000
```

Environment variables:

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Server-side Whisper transcription ([get a key](https://console.groq.com/keys)). Optional — the app falls back to in-browser Whisper without it. |
| `SUPABASE_URL` | Your Supabase project URL. Required for the community board. |
| `SUPABASE_ANON_KEY` | Supabase anon key (safe by design under RLS; kept server-side anyway). |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used for SEO metadata/sitemap. Optional locally. |

Recording needs microphone permission and a secure context (`localhost` or HTTPS).

## Deploy (Vercel)

Import the repo, set the env vars above in project settings, deploy. Default
Next.js build settings work. Security headers (`X-Frame-Options`, `nosniff`,
`Referrer-Policy`, `Permissions-Policy`) ship from `next.config.ts`.

> Note: Vercel Hobby caps request bodies at ~4.5MB. A 2–3 minute opus
> recording is ~1–2MB, well under the limit. For much longer recordings,
> switch to a direct-to-storage upload flow.

## Roadmap

- AI feedback on transcripts (clarity, structure, filler words, pacing) — the
  UI slot and `Pitch.feedback` field are already reserved.
