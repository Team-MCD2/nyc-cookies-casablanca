import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase admin client (service role, bypasses RLS).
 * Only use server-side, NEVER expose to the browser.
 *
 * Used for privileged operations like:
 * - Creating orders/invoices on behalf of a Clerk user
 * - Generating Pro invitations
 * - Admin dashboard queries
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
