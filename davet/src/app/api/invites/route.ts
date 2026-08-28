import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/db";
import { currentOwner } from "@/lib/auth";
import { orgFor } from "@/lib/org";
import { LOCALES, PLAN_QUOTA } from "@/lib/types";
import { DEFAULT_LOCALE } from "@/lib/i18n";

const Body = z.object({
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
  /** Skips the worked example and hands over empty fields. */
  blank: z.boolean().default(false),
});

export async function POST(req: Request) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const locale = parsed.success ? parsed.data.locale : DEFAULT_LOCALE;
  const blank = parsed.success ? parsed.data.blank : false;

  const db = await store();
  const org = await orgFor(owner);

  // Quota is a property of the plan, not of the login. -1 is unlimited, which
  // is what "unbegrenzt viele Hochzeiten" has to mean on the Profi tier.
  const quota = PLAN_QUOTA[org.plan];
  if (quota >= 0 && (await db.countOrgInvites(org.id)) >= quota) {
    return NextResponse.json(
      { error: "quota_reached", quota, plan: org.plan },
      { status: 402 },
    );
  }

  const invite = await db.createInvite(owner, locale, { blank, orgId: org.id });

  // The venue's details are the same on every invitation it puts out, so they
  // arrive filled in rather than being retyped sixty times a year.
  const branded = await db.updateInvite(invite.id, owner, {
    organizerName: org.name,
    organizerUrl: org.website,
    organizerPhone: org.phone,
  });

  return NextResponse.json({ invite: branded });
}
