import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isUuid } from "@/lib/validate";
import { countRecent } from "@/lib/rateLimit";

export const runtime = "nodejs";

const FAVORITE_DEVICE_MAX = 30;
const FAVORITE_DEVICE_WINDOW_SEC = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid topic id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const { deviceId } = (body ?? {}) as Record<string, unknown>;

  if (!isUuid(deviceId)) {
    return NextResponse.json({ error: "Invalid device id." }, { status: 400 });
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

  const recent = await countRecent(
    supabase,
    "topic_favorites",
    "device_id",
    deviceId,
    FAVORITE_DEVICE_WINDOW_SEC
  );
  if (recent >= FAVORITE_DEVICE_MAX) {
    return NextResponse.json(
      { error: "Too many favorites at once — slow down a little." },
      { status: 429 }
    );
  }

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
