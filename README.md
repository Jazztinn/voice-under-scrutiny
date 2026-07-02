# Voice Under Scrutiny

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.9-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-19.2.4-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Groq-Whisper-F55036?style=for-the-badge" alt="Groq Whisper"/>
  <img src="https://img.shields.io/badge/Hugging%20Face-Transformers-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="Hugging Face Transformers"/>
  <img src="https://img.shields.io/badge/Vercel-Ready-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

---

> Practice the pitch before the room hears it. Voice Under Scrutiny gives you a topic, records your answer, transcribes it, and keeps a private browser-local history so you can judge your own clarity over time.

**Live demo:**

<p align="center">
  <a href="https://voice-under-scrutiny.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/>
  </a>
</p>

## Why this matters

Public speaking improves through repetition, playback, and concrete evidence. Most practice tools either stop at a timer or require accounts, uploads, and opaque storage. Voice Under Scrutiny keeps the loop small and useful:

- Get an impromptu speaking topic.
- Record from the microphone with a live audio-reactive ring.
- Listen back before judging the transcript.
- Transcribe with Groq Whisper, then fall back to in-browser Whisper when the server key is unavailable.
- Save attempts locally in IndexedDB so the speaker owns the practice log.

No login is required. Recordings and transcripts stay in the user's browser unless audio is explicitly sent to the transcription route.

## Core flow

| Step | What happens |
|---|---|
| Topic | The app serves a curated prompt or a community-submitted prompt. |
| Record | `MediaRecorder` captures microphone audio and Web Audio drives the recording visualizer. |
| Playback | The speaker reviews the raw answer before reading the transcript. |
| Transcribe | `/api/transcribe` proxies audio to Groq Whisper; on failure, a Web Worker runs browser-local Whisper. |
| Save | Audio, transcript, topic, duration, and timestamp are stored in IndexedDB. |
| Review | `/history` shows saved pitches, transcripts, durations, and delete controls. |

## Community topics

The `/community` board lets anonymous visitors submit practice topics, vote on useful prompts, and star favorites. Identity is a random per-browser device ID stored in `localStorage`; topics are attributed as anonymous.

Server-side community routes use Supabase:

| Object | Purpose |
|---|---|
| `community_topics` | Stores prompt, scenario, cases, anonymous author, device ID, and timestamps. |
| `topic_votes` | Stores one upvote/downvote per device per topic. |
| `topic_favorites` | Stores one favorite per device per topic. |
| `community_topics_with_stats` | Read view used by the app for score, upvotes, downvotes, and favorite counts. |

Route-level rate limits deter casual abuse:

| Action | Limit |
|---|---:|
| Topic submissions | 5 per device per 10 minutes |
| Global topic submissions | 30 per minute |
| Votes | 30 per device per minute |
| Favorites | 30 per device per minute |

Device IDs are self-reported, so these limits are guardrails rather than a security boundary. For a public high-traffic deployment, add database constraints, RLS policies, and edge/WAF protections.

## Stack

| Layer | Technology |
|---|---|
| App framework | Next.js 16 App Router |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Recording | `MediaRecorder`, Web Audio `AnalyserNode`, canvas visualizer |
| Local storage | IndexedDB via `idb` |
| Transcription | Groq Whisper server route, Hugging Face Transformers browser fallback |
| Community backend | Supabase Postgres with server-side route handlers |
| Deployment | Vercel |

## Quick start

```bash
git clone https://github.com/Jazztinn/voice-under-scrutiny.git
cd voice-under-scrutiny
cp .env.local.example .env.local
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Recording requires microphone permission and a secure context. `localhost` is accepted by browsers; production must use HTTPS.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | Optional | Server-side key for Groq Whisper transcription. Without it, transcription falls back to in-browser Whisper. |
| `SUPABASE_URL` | Required for community board | Supabase project URL used by `/api/community/*`. |
| `SUPABASE_ANON_KEY` | Required for community board | Supabase anon key used by server-side community routes. Configure RLS policies in Supabase before public deployment. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical URL for metadata, sitemap, and robots output. Defaults to the Vercel demo URL. |

The first in-browser Whisper run downloads a quantized model and caches it. Expect a larger first transcription on a fresh browser profile.

## Useful scripts

```bash
npm run dev      # start local development server
npm run build    # create production build
npm run start    # serve production build
npm run lint     # run ESLint
```

## Deploy

Vercel's default Next.js settings are sufficient.

1. Import `https://github.com/Jazztinn/voice-under-scrutiny`.
2. Set the environment variables listed above.
3. Deploy.

Security headers are configured in `next.config.ts`:

| Header | Policy |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Allows same-origin microphone access; blocks camera and geolocation. |

Vercel Hobby request bodies are capped at roughly 4.5MB. A short Opus pitch recording is usually below that limit; long-form recording should use direct-to-storage upload before transcription.

## Privacy model

| Data | Storage location |
|---|---|
| Pitch audio | Browser IndexedDB |
| Transcript | Browser IndexedDB |
| Topic history metadata | Browser IndexedDB |
| Community device ID | Browser `localStorage` |
| Community topics/votes/favorites | Supabase |
| Audio sent for Groq transcription | Sent only through `/api/transcribe` when server transcription is attempted |

## Roadmap

- Add transcript feedback for clarity, structure, filler words, and pacing.
- Add Supabase migrations for repeatable community setup.
- Add export/import for local pitch history.
- Add optional direct-to-storage flow for longer recordings.

## License

MIT. See [LICENSE](LICENSE).
