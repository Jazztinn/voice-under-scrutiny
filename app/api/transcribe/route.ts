import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GEMINI_MODEL = process.env.GEMINI_AUDIO_MODEL ?? "gemini-2.5-flash";

// Note: Vercel serverless request bodies are capped (~4.5MB on Hobby). A 2–3 min
// opus recording is ~1–2MB, well under the cap. Longer recordings may need a
// direct-to-storage upload flow instead.
const MAX_BYTES = 4.5 * 1024 * 1024;

export async function POST(req: Request) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (!geminiKey && !groqKey) {
    return NextResponse.json(
      { error: "Server missing an AI API key." },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No audio file provided." },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Audio file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Recording too large to transcribe (max ~4.5MB)." },
      { status: 413 }
    );
  }

  if (geminiKey) {
    try {
      const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [
              { text: "Transcribe this speech exactly. Return only the transcript, with no commentary." },
              { inlineData: { mimeType: file.type || "audio/webm", data: bytes } },
            ] }],
          }),
          signal: AbortSignal.timeout(45000),
        }
      );
      if (!res.ok) {
        console.error("Gemini transcription failed:", res.status, await res.text());
        return NextResponse.json({ error: "Transcription failed." }, { status: 502 });
      }
      const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> };
      const transcript = data.candidates?.[0]?.content?.parts?.map((part) => part.text).find((text): text is string => typeof text === "string");
      return NextResponse.json({ transcript: transcript?.trim() ?? "" });
    } catch (err) {
      console.error("Gemini transcription request failed:", err);
      return NextResponse.json({ error: "Could not reach transcription service." }, { status: 502 });
    }
  }

  const upstream = new FormData();
  // The endpoint needs a filename with a recognized audio extension.
  const ext = (file.type.split("/")[1] || "webm").split(";")[0];
  upstream.append("file", file, `pitch.${ext}`);
  // Groq's OpenAI-compatible Whisper endpoint. large-v3 = highest accuracy.
  upstream.append("model", "whisper-large-v3");

  try {
    const res = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}` },
        body: upstream,
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error("Whisper error:", res.status, detail);
      return NextResponse.json(
        { error: "Transcription failed." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ transcript: data.text ?? "" });
  } catch (err) {
    console.error("Whisper request failed:", err);
    return NextResponse.json(
      { error: "Could not reach transcription service." },
      { status: 502 }
    );
  }
}
