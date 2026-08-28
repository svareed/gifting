import { NextResponse } from "next/server";
import { SUPABASE_CONFIGURED } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!SUPABASE_CONFIGURED || !code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { createServerClient } = await import("@supabase/ssr");
  const { cookies } = await import("next/headers");
  const jar = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (list) => {
          for (const c of list) jar.set(c.name, c.value, c.options);
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(
    new URL(error ? "/login" : "/dashboard", url.origin),
  );
}
