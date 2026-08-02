import { NextResponse } from "next/server";

export const runtime = "nodejs";

function localFeedback(transcript: string) {
  const words: string[] = transcript.toLowerCase().match(/[a-z']+/g) ?? [];
  const fillers = ["um", "uh", "like", "you know", "basically", "actually"].filter((word) => {
    if (word.includes(" ")) return transcript.toLowerCase().includes(word);
    return words.includes(word);
  });
  const sentences = transcript.split(/[.!?]+/).filter(Boolean).length;
  const uniqueRatio = new Set(words).size / Math.max(words.length, 1);
  return {
    summary: "This local review is based on the transcript because cloud feedback was unavailable.",
    clarity: Math.max(1, Math.min(10, Math.round(uniqueRatio * 10))),
    structure: Math.max(1, Math.min(10, sentences >= 2 ? 7 : 4)),
    pacing: Math.max(1, Math.min(10, 8 - Math.min(fillers.length, 5))),
    fillerWords: fillers,
    strengths: [words.length >= 20 ? "You provided enough material to review." : "You kept the response concise.", sentences >= 2 ? "Your transcript has multiple sentence beats." : "There is a clear starting point to build on."],
    nextStep: fillers.length ? `Practice the same answer once more, replacing ${fillers.join(", ")} with a short pause.` : "Add one concrete example and a closing sentence to make the answer more memorable.",
  };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "AI feedback is not configured." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { transcript?: unknown } | null;
  if (typeof body?.transcript !== "string" || !body.transcript.trim()) {
    return NextResponse.json({ error: "A transcript is required." }, { status: 400 });
  }
  const transcript = body.transcript.trim().slice(0, 12000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash")}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You are a kind but rigorous public-speaking coach. Evaluate only what the transcript supports. Return valid JSON." }] },
        contents: [{ parts: [{ text: `Evaluate this spoken pitch transcript:\n\n${transcript}\n\nGive scores from 1-10, identify likely filler words only when present, name specific strengths, and give one concrete next step.` }] }],
        // Gemini's JSON mode is more portable across API-key/model versions
        // than sending the full schema (some deployments reject array limits).
        generationConfig: { temperature: 0.2, maxOutputTokens: 700, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("Gemini feedback failed:", res.status, detail);
      return NextResponse.json({ feedback: localFeedback(transcript), source: "local" });
    }
    const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;
    if (typeof text !== "string") return NextResponse.json({ error: "AI returned no feedback." }, { status: 502 });
    return NextResponse.json({ feedback: JSON.parse(text) });
  } catch (err) {
    console.error("Feedback request failed:", err);
    return NextResponse.json({ feedback: localFeedback(transcript), source: "local" });
  }
}
