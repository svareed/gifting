import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/db";
import { withinRateLimit } from "@/lib/ratelimit";
import { clientIp, hashIp } from "@/lib/iphash";

const Body = z.object({
  inviteId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  attending: z.boolean(),
  guestCount: z.number().int().min(0).max(20),
  message: z.string().max(1000).default(""),
  trap: z.string().max(200).optional(),
  /** Present when the reply came through a household link. */
  guestToken: z.string().regex(/^[a-z0-9]{6,16}$/).nullish(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { inviteId, trap, guestToken, ...rsvp } = parsed.data;

  // A filled honeypot means a bot. Answer 200 so it learns nothing.
  if (trap) return NextResponse.json({ ok: true });

  const db = await store();
  if (!(await db.getPublishedById(inviteId))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // A household may confirm at most the seats it was given. Trusting the form
  // here would put the whole point of the guest list back in the browser.
  let guestId: string | null = null;
  if (guestToken) {
    const guest = await db.getGuestByToken(inviteId, guestToken);
    if (!guest) return NextResponse.json({ error: "unknown_guest" }, { status: 404 });
    guestId = guest.id;
    if (rsvp.guestCount > guest.seats) rsvp.guestCount = guest.seats;
  }

  const ipHash = hashIp(clientIp(req));
  if (!(await withinRateLimit(db, "rsvps", ipHash, 8, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  await db.addRsvp(inviteId, { ...rsvp, guestId, ipHash });
  return NextResponse.json({ ok: true });
}
