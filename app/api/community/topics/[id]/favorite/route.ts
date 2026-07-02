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
  const { deviceId } = (body ?? {}) as Record<string, unknown>;

  if (typeof deviceId !== "string" || !deviceId.trim()) {
    return NextResponse.json({ error: "Missing device id." }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("topic_favorites")
    .select("id")
    .eq("topic_id", id)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("topic_favorites")
      .delete()
      .eq("id", existing.id);
    if (error) {
      console.error("Failed to remove favorite:", error);
      return NextResponse.json({ error: "Failed to update favorite." }, { status: 500 });
    }
    return NextResponse.json({ favorited: false });
  }

  const { error } = await supabase
    .from("topic_favorites")
    .insert({ topic_id: id, device_id: deviceId });
  if (error) {
    console.error("Failed to add favorite:", error);
    return NextResponse.json({ error: "Failed to update favorite." }, { status: 500 });
  }
  return NextResponse.json({ favorited: true });
}
