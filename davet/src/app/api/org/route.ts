import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/db";
import { currentOwner } from "@/lib/auth";
import { orgFor } from "@/lib/org";
import { PLANS } from "@/lib/types";
import { isSlugAvailableShape } from "@/lib/slug";

const Patch = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().max(60).optional(),
  logoUrl: z.string().trim().max(500).optional(),
  website: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(60).optional(),
  plan: z.enum(PLANS).optional(),
});

export async function PATCH(req: Request) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const db = await store();
  const org = await orgFor(owner);
  const patch = { ...parsed.data };

  // The subdomain is the venue's public address; a clash is an error rather
  // than something to silently rename around.
  if (patch.slug !== undefined && patch.slug !== org.slug) {
    if (!isSlugAvailableShape(patch.slug)) {
      return NextResponse.json({ error: "slug_invalid" }, { status: 409 });
    }
    if (await db.orgSlugTaken(patch.slug, org.id)) {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
  }

  try {
    return NextResponse.json({ org: await db.updateOrg(org.id, owner, patch) });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
