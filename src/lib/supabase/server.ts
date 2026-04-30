import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Supabase client for server components / route handlers / server actions.
 * Reads/writes auth cookies so RLS works with Supabase Auth (if used).
 *
 * In our setup Clerk handles auth identity and we map clerkUserId →
 * customers/pros tables. The anon key is enough for read access; mutations
 * go through the admin client (see ./admin.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — ignore. Middleware refreshes the session.
          }
        },
      },
    },
  );
}
