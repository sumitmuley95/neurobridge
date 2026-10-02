import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 * Uses the service-role key, which bypasses Row Level Security.
 * Every server action must check the logged-in user (getCurrentStudent,
 * getCurrentTeacher, etc.) before reading or writing data.
 *
 * NEVER import this file from a "use client" component.
 */
export async function createClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}