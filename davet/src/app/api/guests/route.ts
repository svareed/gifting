import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/db";
import { currentOwner } from "@/lib/auth";

const Guest = z.object({
  id: z.string().min(1),
  token: z.string().regex(/^[a-z0-9]{6,16}$/),
  household: z.string().trim().max(120),
  seats: z.number().int().min(1).max(20),
  email: z.string().trim().max(200),
  phone: z.string().trim().max(60),
  sort: z.number().int(),
});

const Body = z.object({
  inviteId: z.string().min(1),
  // A wedding hall's largest list; beyond this the browser is the wrong tool.
  guests: z.array(Guest).max(400),
});

export async function PUT(req: Request) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", detail: parsed.error.issues }, { status: 400 });
  }

  const { inviteId, guests } = parsed.data;
  const tokens = new Set(guests.map((g) => g.token));
  if (tokens.size !== guests.length) {
    return NextResponse.json({ error: "duplicate_token" }, { status: 409 });
  }

  try {
    const saved = await (await store()).replaceGuests(
      inviteId, owner, guests.map((g) => ({ ...g, inviteId })),
    );
    return NextResponse.json({ guests: saved });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
