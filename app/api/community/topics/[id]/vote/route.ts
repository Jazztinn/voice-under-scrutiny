import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const { deviceId, value } = (body ?? {}) as Record<string, unknown>;

  if (typeof deviceId !== "string" || !deviceId.trim()) {
    return NextResponse.json({ error: "Missing device id." }, { status: 400 });
  }
  if (value !== 1 && value !== -1) {
    return NextResponse.json({ error: "Value must be 1 or -1." }, { status: 400 });
  }

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

  const { data: existing } = await supabase
    .from("topic_votes")
    .select("id, value")
    .eq("topic_id", id)
    .eq("device_id", deviceId)
    .maybeSingle();

  // Voting the same direction again un-votes (toggle off).
  if (existing && existing.value === value) {
    const { error } = await supabase.from("topic_votes").delete().eq("id", existing.id);
    if (error) {
      console.error("Failed to remove vote:", error);
      return NextResponse.json({ error: "Failed to update vote." }, { status: 500 });
    }
    return NextResponse.json({ myVote: 0 });
  }

  if (existing) {
    const { error } = await supabase
      .from("topic_votes")
      .update({ value })
      .eq("id", existing.id);
    if (error) {
      console.error("Failed to change vote:", error);
      return NextResponse.json({ error: "Failed to update vote." }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("topic_votes")
      .insert({ topic_id: id, device_id: deviceId, value });
    if (error) {
      console.error("Failed to cast vote:", error);
      return NextResponse.json({ error: "Failed to update vote." }, { status: 500 });
    }
  }

  return NextResponse.json({ myVote: value });
}
