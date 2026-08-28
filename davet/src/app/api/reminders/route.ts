import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/db";
import { currentOwner } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { guestLink } from "@/lib/guestToken";
import { reminderText } from "@/lib/reminders";
import { EMAIL_CONFIGURED, sendEmail } from "@/lib/email";
import { REMINDER_KINDS } from "@/lib/types";

/**
 * The daily run. Cron hits GET; the cron secret guards it exactly the way
 * /api/keepalive does. Email goes out here when a provider is configured;
 * WhatsApp cannot be sent server-side without the Business API, so those are
 * left for the venue to send from the dashboard with one tap.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const db = await store();
  const now = new Date().toISOString();
  const due = await db.remindersDue(now);

  let sent = 0;
  let skipped = 0;

  for (const item of due) {
    if (!item.guest.email || !EMAIL_CONFIGURED) { skipped++; continue; }
    const link = guestLink(SITE_URL, item.invite.slug, item.guest.token);
    const couple = `${item.invite.partnerAName} & ${item.invite.partnerBName}`.trim();
    const res = await sendEmail(item.guest.email, couple, reminderText(item, link));
    if (res.ok) {
      await db.markReminded(item.guest.id, item.kind, "email", new Date().toISOString());
      sent++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({
    due: due.length, sent, skipped, emailConfigured: EMAIL_CONFIGURED,
  });
}

const Mark = z.object({
  guestId: z.string().min(1),
  kind: z.enum(REMINDER_KINDS),
  channel: z.enum(["email", "whatsapp"]),
});

/** Marks one reminder as sent by hand, after the venue tapped through. */
export async function POST(req: Request) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Mark.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { guestId, kind, channel } = parsed.data;
  await (await store()).markReminded(guestId, kind, channel, new Date().toISOString());
  return NextResponse.json({ ok: true });
}
