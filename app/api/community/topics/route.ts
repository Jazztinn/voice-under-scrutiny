import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isUuid } from "@/lib/validate";
import { countRecent } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Per-device: 5 topics / 10 min. Global brake: 30 topics / min across all
// devices, so rotating device IDs can't flood the board unbounded.
const TOPIC_DEVICE_MAX = 5;
const TOPIC_DEVICE_WINDOW_SEC = 600;
const TOPIC_GLOBAL_MAX = 30;
const TOPIC_GLOBAL_WINDOW_SEC = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "new" ? "new" : "top";
  const rawDeviceId = searchParams.get("deviceId");
  const deviceId = isUuid(rawDeviceId) ? rawDeviceId : null;

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error("Supabase not configured:", err);
    return NextResponse.json(
      { error: "Server missing Supabase configuration." },
      { status: 500 }
    );
  }

  let query = supabase.from("community_topics_with_stats").select("*");
  query =
    sort === "new"
      ? query.order("created_at", { ascending: false })
      : query
          .order("score", { ascending: false })
          .order("created_at", { ascending: false });

  const { data: topics, error } = await query;
  if (error) {
    console.error("Failed to load community topics:", error);
    return NextResponse.json({ error: "Failed to load topics." }, { status: 500 });
  }

  let myVotes = new Map<string, number>();
  let myFavorites = new Set<string>();
  if (deviceId) {
    const [{ data: votes }, { data: favorites }] = await Promise.all([
      supabase.from("topic_votes").select("topic_id, value").eq("device_id", deviceId),
      supabase.from("topic_favorites").select("topic_id").eq("device_id", deviceId),
    ]);
    myVotes = new Map((votes ?? []).map((v) => [v.topic_id as string, v.value as number]));
    myFavorites = new Set((favorites ?? []).map((f) => f.topic_id as string));
  }

  const result = (topics ?? []).map((t) => ({
    ...t,
    myVote: myVotes.get(t.id as string) ?? 0,
    favorited: myFavorites.has(t.id as string),
  }));

  return NextResponse.json({ topics: result });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { prompt, scenario, cases, deviceId } = (body ?? {}) as Record<string, unknown>;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }
  if (typeof scenario !== "string" || !scenario.trim()) {
    return NextResponse.json({ error: "Scenario is required." }, { status: 400 });
  }
  if (!Array.isArray(cases) || cases.some((c) => typeof c !== "string")) {
    return NextResponse.json(
      { error: "Cases must be a list of strings." },
      { status: 400 }
    );
  }
  if (!isUuid(deviceId)) {
    return NextResponse.json({ error: "Invalid device id." }, { status: 400 });
  }

  const cleanCases = (cases as string[])
    .map((c) => c.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 10);

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error("Supabase not configured:", err);
    return NextResponse.json(
      { error: "Server missing Supabase configuration." },
      { status: 500 }
    );
  }

  const [byDevice, global] = await Promise.all([
    countRecent(supabase, "community_topics", "device_id", deviceId, TOPIC_DEVICE_WINDOW_SEC),
    countRecent(supabase, "community_topics", null, null, TOPIC_GLOBAL_WINDOW_SEC),
  ]);
  if (byDevice >= TOPIC_DEVICE_MAX) {
    return NextResponse.json(
      { error: "You're submitting topics too quickly — try again in a few minutes." },
      { status: 429 }
    );
  }
  if (global >= TOPIC_GLOBAL_MAX) {
    return NextResponse.json(
      { error: "The community is busy right now — try again shortly." },
      { status: 429 }
    );
  }

  const { data, error } = await supabase
    .from("community_topics")
    .insert({
      prompt: prompt.trim().slice(0, 500),
      scenario: scenario.trim().slice(0, 1000),
      cases: cleanCases,
      author_username: "Anonymous",
      device_id: deviceId,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create community topic:", error);
    return NextResponse.json({ error: "Failed to submit topic." }, { status: 500 });
  }

  return NextResponse.json({ topic: data }, { status: 201 });
}
