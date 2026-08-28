import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { store } from "@/lib/db";
import { currentOwner } from "@/lib/auth";
import { isSlugAvailableShape, suggestSlug } from "@/lib/slug";
import { LOCALES, OPENER_IDS, THEME_IDS, TRADITIONS } from "@/lib/types";

const Event = z.object({
  id: z.string(), sort: z.number().int(),
  presetKey: z.string().nullable(), customName: z.string().nullable(),
  venueName: z.string().max(160), venueAddress: z.string().max(240),
  mapsUrl: z.string().max(500),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?Z$/),
  note: z.string().max(240),
});

const Family = z.object({
  id: z.string(), side: z.enum(["a", "b"]),
  personName: z.string().max(120), parents: z.string().max(400),
  grandparents: z.string().max(400),
});

const Verse = z.object({
  id: z.string(), sort: z.number().int(),
  libraryKey: z.string().nullable(), customArabic: z.string().max(1000).nullable(),
  customText: z.string().max(1000).nullable(), customRef: z.string().max(160).nullable(),
});

const Patch = z.object({
  slug: z.string().optional(),
  slugLocked: z.boolean().optional(),
  status: z.enum(["draft", "published"]).optional(),
  locale: z.enum(LOCALES).optional(),
  tradition: z.enum(TRADITIONS).optional(),
  theme: z.enum(THEME_IDS).optional(),
  opener: z.enum(OPENER_IDS).optional(),
  timezone: z.string().max(64).optional(),
  partnerAName: z.string().max(80).optional(),
  partnerBName: z.string().max(80).optional(),
  sections: z.record(z.string(), z.boolean()).optional(),
  rsvpDeadline: z.string().nullable().optional(),
  organizerName: z.string().max(120).optional(),
  organizerUrl: z.string().max(500).optional(),
  organizerPhone: z.string().max(60).optional(),
  infoWeather: z.string().max(600).optional(),
  infoDress: z.string().max(600).optional(),
  infoParking: z.string().max(600).optional(),
  events: z.array(Event).max(10).optional(),
  families: z.array(Family).max(6).optional(),
  verses: z.array(Verse).max(8).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", detail: parsed.error.issues }, { status: 400 });
  }

  const db = await store();
  const patch = { ...parsed.data };

  const current = await db.getInvite(id, owner);
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const locked = patch.slugLocked ?? current.slugLocked;

  if (locked && patch.slug !== undefined) {
    // A hand-edited address is the owner's decision, so a clash is an error
    // rather than something to silently rename around.
    if (!isSlugAvailableShape(patch.slug)) {
      return NextResponse.json({ error: "slug_invalid" }, { status: 409 });
    }
    if (await db.slugTaken(patch.slug, id)) {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
  } else if (!locked && current.status === "draft") {
    // The address follows the names while the invitation is still a draft.
    // Publishing freezes it, because guests may already hold the link.
    const a = patch.partnerAName ?? current.partnerAName;
    const b = patch.partnerBName ?? current.partnerBName;
    patch.slug = await uniqueSlug(
      suggestSlug(a, b, patch.locale ?? current.locale),
      id,
      db,
    );
  } else {
    delete patch.slug;
  }

  try {
    // updateInvite filters on owner_id, so another owner's id cannot be patched.
    const invite = await db.updateInvite(id, owner, patch as never);

    // /[slug] is cached for 60s; without this an edit takes up to a minute to
    // reach guests, and the old address keeps serving after a rename.
    revalidatePath(`/${invite.slug}`);
    if (current.slug !== invite.slug) revalidatePath(`/${current.slug}`);

    return NextResponse.json({ invite });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

/** Appends -2, -3 … until the address is free. */
async function uniqueSlug(
  base: string,
  exceptId: string,
  db: Awaited<ReturnType<typeof store>>,
): Promise<string> {
  let candidate = isSlugAvailableShape(base) ? base : "our-wedding";
  for (let n = 2; await db.slugTaken(candidate, exceptId); n++) {
    candidate = `${base}-${n}`;
    if (n > 50) break;
  }
  return candidate;
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await params;
  await (await store()).deleteInvite(id, owner);
  return NextResponse.json({ ok: true });
}
