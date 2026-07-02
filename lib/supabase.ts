import { createClient } from "@supabase/supabase-js";

// Server-only: used inside app/api/community/** route handlers. The anon key
// is safe by design (protected by RLS), but stays out of the client bundle
// here to match the existing GROQ_API_KEY server-only pattern.
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY are not configured.");
  }
  return createClient(url, key);
}
