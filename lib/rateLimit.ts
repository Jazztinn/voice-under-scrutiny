import type { SupabaseClient } from "@supabase/supabase-js";

// Rate limiting by counting recent rows in the tables we already write to —
// no extra infrastructure. Honest limitation: device_id is self-reported, so
// this deters casual spam/misclicks, not a determined attacker rotating IDs
// (the global topic brake covers the flood case; Vercel WAF is the escalation
// path beyond that).

/** Rows in `table` matching `column = value` created in the last `windowSec`. */
export async function countRecent(
  supabase: SupabaseClient,
  table: string,
  column: string | null,
  value: string | null,
  windowSec: number
): Promise<number> {
  const since = new Date(Date.now() - windowSec * 1000).toISOString();
  let query = supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);
  if (column && value) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) {
    // Fail open: a broken rate-limit check shouldn't take the feature down.
    console.error(`Rate-limit count failed for ${table}:`, error);
    return 0;
  }
  return count ?? 0;
}
