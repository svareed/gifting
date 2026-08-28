import { cookies } from "next/headers";
import { SUPABASE_CONFIGURED } from "./db";
import { DEMO_OWNER } from "./db/demo";

/**
 * Demo mode has a single implicit owner so the builder is usable with no
 * credentials. With Supabase configured, the owner comes from the magic-link
 * session cookie.
 */
export async function currentOwner(): Promise<string | null> {
  if (!SUPABASE_CONFIGURED) return DEMO_OWNER;

  const { createServerClient } = await import("@supabase/ssr");
  const jar = await cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (list) => {
          try {
            for (const c of list) jar.set(c.name, c.value, c.options);
          } catch {
            // Called from a Server Component: the middleware refreshes instead.
          }
        },
      },
    },
  );
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

export async function requireOwner(): Promise<string> {
  const owner = await currentOwner();
  if (!owner) throw new Error("UNAUTHENTICATED");
  return owner;
}
