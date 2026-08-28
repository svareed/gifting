import { NextResponse } from "next/server";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Supabase pauses a free-tier project after roughly a week without activity,
 * which would take every published invitation offline mid-engagement. One
 * cheap read a day keeps the project marked active — see vercel.json.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Any real query counts as activity; this one touches no personal data.
    await (await store()).getPublishedBySlug("__keepalive__");
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
