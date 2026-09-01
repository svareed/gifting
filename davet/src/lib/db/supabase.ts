import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { seedInvite } from "../seed";
import { REMINDER_DAYS, REMINDER_KINDS } from "../types";
import type {
  Guest, Invite, Locale, Organization, Reminder, Rsvp,
} from "../types";
import type { DueReminder, NewRsvp, Store, SubmissionKind } from "./index";
import { reminderAnchor } from "./demo";

/**
 * Server-only. Holds the service role, so every query filters on owner_id
 * explicitly, the checks in this file are the enforcement, and the RLS
 * policies in supabase/schema.sql are the second line of defence covering
 * anything that reaches PostgREST with the anon key.
 */
function client(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

const SELECT = "*, events(*), families(*), verses(*)";

/** Explicit columns: `*` would send guests' ip_hash to the couple's browser. */
const RSVP_COLUMNS =
  "id,invite_id,guest_id,name,attending,guest_count,message,created_at";

/* eslint-disable @typescript-eslint/no-explicit-any */
function toOrg(r: any): Organization {
  return {
    id: r.id, name: r.name, slug: r.slug,
    logoUrl: r.logo_url ?? "", website: r.website ?? "", phone: r.phone ?? "",
    plan: r.plan ?? "basis", createdAt: r.created_at,
  };
}

function toGuest(r: any): Guest {
  return {
    id: r.id, inviteId: r.invite_id, token: r.token, household: r.household ?? "",
    seats: r.seats ?? 2, email: r.email ?? "", phone: r.phone ?? "", sort: r.sort ?? 0,
  };
}
function toInvite(r: any): Invite {
  return {
    id: r.id,
    ownerId: r.owner_id,
    orgId: r.org_id ?? null,
    slug: r.slug,
    status: r.status,
    slugLocked: r.slug_locked ?? false,
    locale: r.locale,
    tradition: r.tradition ?? "islamic",
    addressForm: r.address_form ?? "informal",
    theme: r.theme,
    opener: r.opener,
    timezone: r.timezone,
    partnerAName: r.partner_a_name,
    partnerBName: r.partner_b_name,
    heroImage: r.hero_image,
    inviteCard: r.invite_card,
    sections: r.sections ?? {},
    rsvpDeadline: r.rsvp_deadline,
    infoWeather: r.info_weather,
    infoDress: r.info_dress,
    organizerName: r.organizer_name ?? "",
    organizerUrl: r.organizer_url ?? "",
    organizerPhone: r.organizer_phone ?? "",
    infoParking: r.info_parking,
    events: (r.events ?? [])
      .sort((a: any, b: any) => a.sort - b.sort)
      .map((e: any) => ({
        id: e.id,
        sort: e.sort,
        presetKey: e.preset_key,
        customName: e.custom_name,
        venueName: e.venue_name,
        venueAddress: e.venue_address,
        mapsUrl: e.maps_url,
        startsAt: new Date(e.starts_at).toISOString(),
        note: e.note,
      })),
    families: (r.families ?? []).map((f: any) => ({
      id: f.id,
      side: f.side,
      personName: f.person_name,
      parents: f.parents,
      grandparents: f.grandparents,
    })),
    verses: (r.verses ?? [])
      .sort((a: any, b: any) => a.sort - b.sort)
      .map((v: any) => ({
        id: v.id,
        sort: v.sort,
        libraryKey: v.library_key,
        customArabic: v.custom_arabic,
        customText: v.custom_text,
        customRef: v.custom_ref,
      })),
    updatedAt: r.updated_at,
  };
}

function inviteColumns(p: Partial<Invite>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const map: Record<string, string> = {
    slug: "slug", slugLocked: "slug_locked", status: "status",
    locale: "locale", tradition: "tradition", theme: "theme",
    addressForm: "address_form",
    opener: "opener", timezone: "timezone", partnerAName: "partner_a_name",
    partnerBName: "partner_b_name", heroImage: "hero_image",
    inviteCard: "invite_card", sections: "sections",
    rsvpDeadline: "rsvp_deadline", infoWeather: "info_weather",
    infoDress: "info_dress", infoParking: "info_parking", orgId: "org_id",
    organizerName: "organizer_name", organizerUrl: "organizer_url",
    organizerPhone: "organizer_phone",
  };
  for (const [k, col] of Object.entries(map)) {
    if (k in p) out[col] = (p as any)[k];
  }
  out.updated_at = new Date().toISOString();
  return out;
}

/** Children are small and always rewritten together; replace rather than diff. */
async function replaceChildren(db: SupabaseClient, invite: Invite) {
  await Promise.all([
    db.from("events").delete().eq("invite_id", invite.id),
    db.from("families").delete().eq("invite_id", invite.id),
    db.from("verses").delete().eq("invite_id", invite.id),
  ]);
  if (invite.events.length) {
    await db.from("events").insert(
      invite.events.map((e, i) => ({
        invite_id: invite.id, sort: i, preset_key: e.presetKey,
        custom_name: e.customName, venue_name: e.venueName,
        venue_address: e.venueAddress, maps_url: e.mapsUrl,
        starts_at: e.startsAt, note: e.note,
      })),
    );
  }
  if (invite.families.length) {
    await db.from("families").insert(
      invite.families.map((f) => ({
        invite_id: invite.id, side: f.side, person_name: f.personName,
        parents: f.parents, grandparents: f.grandparents,
      })),
    );
  }
  if (invite.verses.length) {
    await db.from("verses").insert(
      invite.verses.map((v, i) => ({
        invite_id: invite.id, sort: i, library_key: v.libraryKey,
        custom_arabic: v.customArabic, custom_text: v.customText,
        custom_ref: v.customRef,
      })),
    );
  }
}

export function supabaseStore(): Store {
  const db = client();

  return {
    async getPublishedBySlug(slug) {
      const { data } = await db.from("invites").select(SELECT)
        .eq("slug", slug).eq("status", "published").maybeSingle();
      return data ? toInvite(data) : null;
    },
    async getPublishedById(id) {
      const { data } = await db.from("invites").select(SELECT)
        .eq("id", id).eq("status", "published").maybeSingle();
      return data ? toInvite(data) : null;
    },
    async getInvite(id, ownerId) {
      const { data } = await db.from("invites").select(SELECT)
        .eq("id", id).eq("owner_id", ownerId).maybeSingle();
      return data ? toInvite(data) : null;
    },
    async listInvites(ownerId) {
      const { data } = await db.from("invites").select(SELECT)
        .eq("owner_id", ownerId).order("updated_at", { ascending: false });
      return (data ?? []).map(toInvite);
    },
    async createInvite(ownerId, locale: Locale, opts) {
      const draft = seedInvite({ id: "pending", ownerId, locale, blank: opts?.blank, orgId: opts?.orgId ?? null });
      let slug = draft.slug;
      for (let n = 2; await this.slugTaken(slug, ""); n++) {
        slug = `${draft.slug}-${n}`;
      }
      const { data, error } = await db.from("invites")
        .insert({ owner_id: ownerId, ...inviteColumns({ ...draft, slug }) })
        .select("*").single();
      if (error) throw error;

      const created = toInvite({ ...data, events: [], families: [], verses: [] });
      await replaceChildren(db, { ...draft, id: created.id });
      return (await this.getInvite(created.id, ownerId))!;
    },
    async updateInvite(id, ownerId, patch) {
      const current = await this.getInvite(id, ownerId);
      if (!current) throw new Error("Not found");

      const { error } = await db.from("invites")
        .update(inviteColumns(patch)).eq("id", id).eq("owner_id", ownerId);
      if (error) throw error;

      if (patch.events || patch.families || patch.verses) {
        await replaceChildren(db, { ...current, ...patch, id });
      }
      return (await this.getInvite(id, ownerId))!;
    },
    async deleteInvite(id, ownerId) {
      await db.from("invites").delete().eq("id", id).eq("owner_id", ownerId);
    },
    async slugTaken(slug, exceptId) {
      const { data } = await db.from("invites").select("id").eq("slug", slug);
      return (data ?? []).some((r: any) => r.id !== exceptId);
    },

    async countRecentSubmissions(kind: SubmissionKind, ipHash, sinceIso) {
      const { count } = await db.from(kind)
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash).gte("created_at", sinceIso);
      return count ?? 0;
    },


    /* --- Organisations -------------------------------------------------- */
    async ensureOrg(ownerId, defaults) {
      const { data: mine } = await db.from("memberships")
        .select("org_id").eq("user_id", ownerId).limit(1).maybeSingle();
      if (mine?.org_id) {
        const found = await this.getOrg(mine.org_id);
        if (found) return found;
      }

      let slug = defaults.slug;
      for (let n = 2; await this.orgSlugTaken(slug, ""); n++) {
        slug = `${defaults.slug}-${n}`;
        if (n > 50) break;
      }
      const { data, error } = await db.from("organizations")
        .insert({ name: defaults.name, slug }).select("*").single();
      if (error) throw error;
      await db.from("memberships")
        .insert({ org_id: data.id, user_id: ownerId, role: "owner" });
      return toOrg(data);
    },
    async getOrg(orgId) {
      const { data } = await db.from("organizations").select("*").eq("id", orgId).maybeSingle();
      return data ? toOrg(data) : null;
    },
    async getOrgBySlug(slug) {
      const { data } = await db.from("organizations").select("*").eq("slug", slug).maybeSingle();
      return data ? toOrg(data) : null;
    },
    async updateOrg(orgId, ownerId, patch) {
      const { data: member } = await db.from("memberships")
        .select("org_id").eq("org_id", orgId).eq("user_id", ownerId).maybeSingle();
      if (!member) throw new Error("Not found");

      const columns: Record<string, unknown> = {};
      if (patch.name !== undefined) columns.name = patch.name;
      if (patch.slug !== undefined) columns.slug = patch.slug;
      if (patch.logoUrl !== undefined) columns.logo_url = patch.logoUrl;
      if (patch.website !== undefined) columns.website = patch.website;
      if (patch.phone !== undefined) columns.phone = patch.phone;
      if (patch.plan !== undefined) columns.plan = patch.plan;

      const { data, error } = await db.from("organizations")
        .update(columns).eq("id", orgId).select("*").single();
      if (error) throw error;
      return toOrg(data);
    },
    async orgSlugTaken(slug, exceptId) {
      let q = db.from("organizations").select("id", { count: "exact", head: true }).eq("slug", slug);
      if (exceptId) q = q.neq("id", exceptId);
      const { count } = await q;
      return (count ?? 0) > 0;
    },
    async countOrgInvites(orgId) {
      const { count } = await db.from("invites")
        .select("id", { count: "exact", head: true }).eq("org_id", orgId);
      return count ?? 0;
    },

    /* --- Guest lists ---------------------------------------------------- */
    async listGuests(inviteId, ownerId) {
      if (!(await this.getInvite(inviteId, ownerId))) return [];
      const { data } = await db.from("guests").select("*")
        .eq("invite_id", inviteId).order("sort", { ascending: true });
      return (data ?? []).map(toGuest);
    },
    async replaceGuests(inviteId, ownerId, guests) {
      if (!(await this.getInvite(inviteId, ownerId))) throw new Error("Not found");
      const keep = guests.map((g) => g.id);
      let del = db.from("guests").delete().eq("invite_id", inviteId);
      if (keep.length) del = del.not("id", "in", `(${keep.join(",")})`);
      await del;

      if (guests.length) {
        const rows = guests.map((g, i) => ({
          id: g.id, invite_id: inviteId, token: g.token, household: g.household,
          seats: g.seats, email: g.email, phone: g.phone, sort: i,
        }));
        const { error } = await db.from("guests").upsert(rows, { onConflict: "id" });
        if (error) throw error;
      }
      return this.listGuests(inviteId, ownerId);
    },
    async getGuestByToken(inviteId, token) {
      const { data } = await db.from("guests").select("*")
        .eq("invite_id", inviteId).eq("token", token).maybeSingle();
      return data ? toGuest(data) : null;
    },

    /* --- Reminders ------------------------------------------------------ */
    async remindersDue(nowIso) {
      const now = Date.parse(nowIso);
      const { data: invites } = await db.from("invites").select(SELECT).eq("status", "published");
      const out: DueReminder[] = [];

      for (const row of invites ?? []) {
        const invite = toInvite(row);
        const anchor = reminderAnchor(invite);
        if (anchor === null) continue;
        // Nothing is due yet for this invitation; skip the guest queries.
        if (now < anchor - REMINDER_DAYS.t14 * 86_400_000) continue;

        const [{ data: guests }, { data: replies }, { data: sent }] = await Promise.all([
          db.from("guests").select("*").eq("invite_id", invite.id),
          db.from("rsvps").select("guest_id").eq("invite_id", invite.id).not("guest_id", "is", null),
          db.from("reminders").select("guest_id,kind").not("sent_at", "is", null),
        ]);
        const replied = new Set((replies ?? []).map((r: any) => r.guest_id));
        const done = new Set((sent ?? []).map((r: any) => `${r.guest_id}:${r.kind}`));
        const org = invite.orgId ? await this.getOrg(invite.orgId) : null;

        for (const g of (guests ?? []).map(toGuest)) {
          if (replied.has(g.id)) continue;
          for (const kind of REMINDER_KINDS) {
            if (now < anchor - REMINDER_DAYS[kind] * 86_400_000) continue;
            if (done.has(`${g.id}:${kind}`)) continue;
            out.push({ invite, org, guest: g, kind });
          }
        }
      }
      return out;
    },
    async listReminders(inviteId, ownerId) {
      if (!(await this.getInvite(inviteId, ownerId))) return [];
      const { data: guests } = await db.from("guests").select("id").eq("invite_id", inviteId);
      const ids = (guests ?? []).map((g: any) => g.id);
      if (!ids.length) return [];
      const { data } = await db.from("reminders").select("*").in("guest_id", ids);
      return (data ?? []).map((r: any): Reminder => ({
        id: r.id, guestId: r.guest_id, kind: r.kind, channel: r.channel, sentAt: r.sent_at,
      }));
    },
    async markReminded(guestId, kind, channel, sentAtIso) {
      await db.from("reminders").upsert(
        { guest_id: guestId, kind, channel, sent_at: sentAtIso },
        { onConflict: "guest_id,kind,channel" },
      );
    },
    async addRsvp(inviteId, r: NewRsvp) {
      // One reply per household: a second one corrects the first rather than
      // inflating the headcount the kitchen cooks against.
      if (r.guestId) await db.from("rsvps").delete().eq("guest_id", r.guestId);
      await db.from("rsvps").insert({
        invite_id: inviteId, guest_id: r.guestId ?? null,
        name: r.name, attending: r.attending,
        guest_count: r.guestCount, message: r.message, ip_hash: r.ipHash,
      });
    },
    async listRsvps(inviteId, ownerId) {
      if (!(await this.getInvite(inviteId, ownerId))) return [];
      const { data } = await db.from("rsvps").select(RSVP_COLUMNS)
        .eq("invite_id", inviteId).order("created_at", { ascending: false });
      return (data ?? []).map((r: any): Rsvp => ({
        id: r.id, inviteId: r.invite_id, guestId: r.guest_id ?? null,
        name: r.name, attending: r.attending,
        guestCount: r.guest_count, message: r.message, createdAt: r.created_at,
      }));
    },
    async countRsvps(inviteId, ownerId) {
      const rows = await this.listRsvps(inviteId, ownerId);
      return {
        yes: rows.filter((r) => r.attending).length,
        no: rows.filter((r) => !r.attending).length,
        guests: rows.filter((r) => r.attending).reduce((s, r) => s + r.guestCount, 0),
      };
    },

  };
}

