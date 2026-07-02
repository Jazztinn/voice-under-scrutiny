import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "new" ? "new" : "top";
  const deviceId = searchParams.get("deviceId");

  const supabase = getSupabase();
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

  const { prompt, scenario, cases, username, deviceId } = (body ?? {}) as Record<
    string,
    unknown
  >;

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
  if (typeof username !== "string" || !username.trim()) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }
  if (typeof deviceId !== "string" || !deviceId.trim()) {
    return NextResponse.json({ error: "Missing device id." }, { status: 400 });
  }

  const cleanCases = (cases as string[])
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 10);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("community_topics")
    .insert({
      prompt: prompt.trim().slice(0, 500),
      scenario: scenario.trim().slice(0, 1000),
      cases: cleanCases,
      author_username: username.trim().slice(0, 40),
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
