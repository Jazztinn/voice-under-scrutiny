import { NextResponse } from "next/server";
import type { Topic } from "@/lib/topics";

export const runtime = "nodejs";

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.2:1b";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const MAX_SEED_CHARS = 500;

type GenerateRequest = {
  seed?: unknown;
};

type OllamaGenerateResponse = {
  response?: unknown;
};

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: unknown;
    content?: { parts?: Array<{ text?: unknown }> };
  }>;
};

const topicSchema = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      description: "A direct speaking-practice prompt.",
    },
    scenario: {
      type: "string",
      description: "The audience, setting, and constraint for the speaker.",
    },
    cases: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
      description: "Three concrete angles the speaker can try.",
    },
  },
  required: ["prompt", "scenario", "cases"],
  additionalProperties: false,
} as const;

function cleanText(value: string, maxLength: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  const clipped = cleaned.slice(0, maxLength + 1);
  const boundary = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf("? "), clipped.lastIndexOf("! "));
  if (boundary >= Math.floor(maxLength * 0.6)) return clipped.slice(0, boundary + 1);
  const wordBoundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, wordBoundary > 0 ? wordBoundary : maxLength).replace(/[,:;\s]+$/, "")}.`;
}

function parseJsonResponse(value: string): unknown {
  const normalized = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(normalized);
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON object found.");
    const objectText = normalized.slice(start, end + 1);
    const repaired = objectText
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(repaired);
    } catch {
      return JSON.parse(repaired.replace(/'([^']*)'/g, '"$1"'));
    }
  }
}

function parseTopic(value: unknown): Topic | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Record<keyof Topic, unknown>> & { topic?: unknown };
  if ("topic" in raw && raw.topic && typeof raw.topic === "object") {
    return parseTopic(raw.topic);
  }
  if (typeof raw.prompt !== "string" || typeof raw.scenario !== "string") {
    return null;
  }
  if (!Array.isArray(raw.cases)) return null;

  const generatedPrompt = cleanText(raw.prompt, 330);
  if (!generatedPrompt) return null;
  const prompt = /^(answer|argue|compare|contrast|debate|defend|deliver|describe|discuss|explain|imagine|introduce|outline|persuade|pitch|present|recount|respond|share|summarize|teach|tell|welcome)\b/i.test(generatedPrompt)
    ? generatedPrompt
    : cleanText(`Discuss this topic aloud: ${generatedPrompt}`, 360);
  const scenario = cleanText(raw.scenario, 360);
  const cases = raw.cases
    .filter((item): item is string => typeof item === "string")
    .map((item) => cleanText(item, 140))
    .filter(Boolean)
    .slice(0, 3);

  if (!prompt || !scenario || cases.length < 3) return null;
  return { prompt, scenario, cases };
}

function buildPrompt(seed: string) {
  return `Create one public-speaking practice topic from this user brief: ${JSON.stringify(seed)}

Return only JSON with:
- prompt: one sentence the user should answer aloud
- scenario: one sentence giving the audience, setting, or pressure
- cases: exactly three short, concrete angles to try

Interpret the whole brief. Preserve its subject, requested role or relationship, audience, setting, tone, point of view, question, and other constraints. Resolve casual wording and minor grammar without changing intent. If the brief is broad, choose a specific angle. Make the result speakable in 60-120 seconds and useful for voice practice. The prompt must tell the user what to speak about; never begin answering it. Prefer an imperative such as Explain, Describe, Argue, Persuade, Teach, Recount, or Respond.`;
}

function fallbackTopic(seed: string): Topic {
  return {
    prompt: cleanText(`Respond aloud to this brief: ${seed}`, 360),
    scenario: "Speak for 60-120 seconds. Follow every role, audience, setting, tone, and format constraint in the brief.",
    cases: [
      "Identify the exact subject and question",
      "Adopt the requested role and audience",
      "Answer directly with one clear example",
    ],
  };
}

function geminiFallback(seed: string, reason: string) {
  return NextResponse.json({
    topic: fallbackTopic(seed),
    provider: "fallback",
    fallbackFrom: "gemini",
    reason,
  });
}

function selectedProvider() {
  const configured = process.env.TOPIC_GENERATION_PROVIDER ?? "auto";
  if (!["auto", "gemini", "groq", "ollama"].includes(configured)) {
    throw new Error("Invalid TOPIC_GENERATION_PROVIDER.");
  }
  if (configured !== "auto") return configured;
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OLLAMA_BASE_URL) return "ollama";
  if (process.env.VERCEL) return "groq";
  return "ollama";
}

async function generateWithGemini(seed: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing GEMINI_API_KEY for cloud topic generation." },
      { status: 500 }
    );
  }

  const model = process.env.GEMINI_TEXT_MODEL ?? DEFAULT_GEMINI_MODEL;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "Create concise public-speaking exercises, never answers. The prompt field must begin with an imperative verb telling the user what to say. Return only valid JSON." }] },
          contents: [{ parts: [{ text: buildPrompt(seed) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1536,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) {
      console.error("Gemini topic generation failed:", res.status, await res.text());
      return geminiFallback(seed, "upstream-error");
    }
    const data = (await res.json()) as GeminiResponse;
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts
      ?.map((part) => part.text)
      .filter((text): text is string => typeof text === "string")
      .join("");
    if (!content) {
      console.error("Gemini returned no topic text:", candidate?.finishReason);
      return geminiFallback(seed, "empty-response");
    }
    let rawTopic: unknown;
    try {
      rawTopic = parseJsonResponse(content);
    } catch {
      console.error("Gemini returned malformed topic JSON:", candidate?.finishReason, content);
      return geminiFallback(seed, "malformed-response");
    }
    const parsed = parseTopic(rawTopic);
    if (!parsed) return geminiFallback(seed, "incomplete-response");
    return NextResponse.json({ topic: parsed, model, provider: "gemini" });
  } catch (err) {
    console.error("Gemini topic request failed:", err);
    return geminiFallback(seed, "request-error");
  }
}

async function generateWithGroq(seed: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing GROQ_API_KEY for cloud topic generation." },
      { status: 500 }
    );
  }

  const model = process.env.GROQ_TEXT_MODEL ?? DEFAULT_GROQ_MODEL;
  const basePayload = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You create concise, useful public-speaking practice topics. Return only valid JSON.",
      },
      { role: "user", content: buildPrompt(seed) },
    ],
    temperature: 0.2,
    max_completion_tokens: 512,
    stream: false,
  };

  const requestGroq = (responseFormat: unknown) => fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...basePayload,
      response_format: responseFormat,
    }),
    signal: AbortSignal.timeout(30000),
  });

  const strictFormat = {
    type: "json_schema",
    json_schema: {
      name: "speaking_topic",
      strict: true,
      schema: topicSchema,
    },
  };
  let res = await requestGroq(strictFormat);
  if (!res.ok && res.status === 400) {
    const detail = await res.text();
    console.error("Groq strict topic generation failed:", detail);
    res = await requestGroq({ type: "json_object" });
  }

  if (!res.ok) {
    const detail = await res.text();
    console.error("Groq topic generation failed:", res.status, detail);
    return NextResponse.json(
      { error: "Groq could not generate a topic." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as GroqChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return NextResponse.json(
      { error: "Groq returned an invalid response." },
      { status: 502 }
    );
  }

  let rawTopic: unknown;
  try {
    rawTopic = JSON.parse(content);
  } catch {
    return NextResponse.json(
      { error: "Groq returned malformed JSON." },
      { status: 502 }
    );
  }

  const parsed = parseTopic(rawTopic);
  if (!parsed) {
    return NextResponse.json(
      { error: "Groq returned an incomplete topic." },
      { status: 502 }
    );
  }

  return NextResponse.json({ topic: parsed, model, provider: "groq" });
}

async function generateWithOllama(seed: string) {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
  let endpoint: URL;
  try {
    endpoint = new URL("/api/generate", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  } catch {
    return NextResponse.json(
      { error: "Invalid OLLAMA_BASE_URL." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: buildPrompt(seed),
        stream: false,
        format: topicSchema,
        options: {
          temperature: 0.7,
          num_predict: 240,
        },
        keep_alive: "10m",
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Ollama topic generation failed:", res.status, detail);
      if (res.status === 404 && detail.includes("model")) {
        return NextResponse.json(
          { error: `Ollama model "${model}" is not installed. Run: ollama pull ${model}` },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: "Ollama could not generate a topic." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as OllamaGenerateResponse;
    if (typeof data.response !== "string") {
      return NextResponse.json(
        { error: "Ollama returned an invalid response." },
        { status: 502 }
      );
    }

    let rawTopic: unknown;
    try {
      rawTopic = JSON.parse(data.response);
    } catch {
      return NextResponse.json(
        { error: "Ollama returned malformed JSON." },
        { status: 502 }
      );
    }

    const parsed = parseTopic(rawTopic);
    if (!parsed) {
      return NextResponse.json(
        { error: "Ollama returned an incomplete topic." },
        { status: 502 }
      );
    }

    return NextResponse.json({ topic: parsed, model, provider: "ollama" });
  } catch (err) {
    console.error("Ollama topic request failed:", err);
    return NextResponse.json(
      { error: "Could not reach Ollama. Is it running locally?" },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (typeof body.seed !== "string") {
    return NextResponse.json({ error: "Prompt seed is required." }, { status: 400 });
  }

  const seed = cleanText(body.seed, MAX_SEED_CHARS);
  if (!seed) {
    return NextResponse.json({ error: "Prompt seed is required." }, { status: 400 });
  }

  try {
    const provider = selectedProvider();
    if (provider === "gemini") return generateWithGemini(seed);
    if (provider === "groq") return generateWithGroq(seed);
    return generateWithOllama(seed);
  } catch (err) {
    console.error("Topic provider configuration failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid topic provider." },
      { status: 500 }
    );
  }
}
