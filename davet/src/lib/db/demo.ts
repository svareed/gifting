import { seedInvite } from "../seed";
import { DEFAULT_LOCALE } from "../i18n";
import { REMINDER_DAYS, REMINDER_KINDS } from "../types";
import type {
  Guest, Invite, Locale, Organization, Reminder, Rsvp,
} from "../types";
import { EXAMPLE_VENUE } from "../brand";
import type { DueReminder, NewRsvp, Store, SubmissionKind } from "./index";

/**
 * Runs Davet with no database at all: everything renders, nothing survives a
 * restart. This exists so the app is previewable before Supabase is wired up.
 */

export const DEMO_OWNER = "demo-owner";

/** IP hashes are kept beside the records, never inside the types handed to
 *  the couple's browser. */
type Submission = { kind: SubmissionKind; ipHash: string; at: number };
type Data = {
  orgs: Map<string, Organization>;
  members: { orgId: string; userId: string }[];
  invites: Map<string, Invite>;
  guests: Guest[];
  reminders: Reminder[];
  rsvps: Rsvp[];
  submissions: Submission[];
};

const g = globalThis as unknown as { __davetDemo?: Data };

function bootstrap(): Data {
  const org: Organization = {
    id: "demo-org",
    name: EXAMPLE_VENUE.name,
    slug: EXAMPLE_VENUE.slug,
    logoUrl: "",
    website: EXAMPLE_VENUE.website,
    phone: EXAMPLE_VENUE.phone,
    plan: "profi",
    createdAt: new Date().toISOString(),
  };

  const invite = seedInvite({ id: "demo", ownerId: DEMO_OWNER, locale: DEFAULT_LOCALE });
  invite.slug = "amir-leyla";
  invite.status = "published";
  invite.sections.music = false;
  invite.orgId = org.id;
  invite.organizerName = org.name;
  invite.organizerUrl = org.website;
  invite.organizerPhone = org.phone;

  // Two households, so the guest list and the reminder queue have something
  // real to show before anyone types anything.
  const guests: Guest[] = [
    { id: "g1", inviteId: invite.id, token: "yilmaz7k", household: "Familie Yılmaz",
      seats: 4, email: "", phone: "", sort: 0 },
    { id: "g2", inviteId: invite.id, token: "weber3q", household: "Familie Weber",
      seats: 2, email: "", phone: "", sort: 1 },
  ];

  return {
    orgs: new Map([[org.id, org]]),
    members: [{ orgId: org.id, userId: DEMO_OWNER }],
    invites: new Map([[invite.id, invite]]),
    guests,
    reminders: [],
    rsvps: [],
    submissions: [],
  };
}

function data(): Data {
  if (!g.__davetDemo) g.__davetDemo = bootstrap();
  return g.__davetDemo;
}

/**
 * The moment reminders count back from: the RSVP deadline when there is one,
 * otherwise the first event. Returns null when there is nothing to count to,
 * which is also how an invitation opts out of reminders.
 */
export function reminderAnchor(invite: Invite): number | null {
  if (invite.rsvpDeadline) {
    const at = Date.parse(`${invite.rsvpDeadline}T12:00:00Z`);
    if (!Number.isNaN(at)) return at;
  }
  const first = [...invite.events].sort((a, b) => a.sort - b.sort)[0];
  if (!first) return null;
  const at = Date.parse(first.startsAt);
  return Number.isNaN(at) ? null : at;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const id = () => Math.random().toString(36).slice(2, 10);

export function demoStore(): Store {
  return {
    async getPublishedBySlug(slug) {
      for (const inv of data().invites.values()) {
        if (inv.slug === slug && inv.status === "published") return clone(inv);
      }
      return null;
    },
    async getPublishedById(inviteId) {
      const inv = data().invites.get(inviteId);
      return inv && inv.status === "published" ? clone(inv) : null;
    },
    async getInvite(inviteId, ownerId) {
      const inv = data().invites.get(inviteId);
      return inv && inv.ownerId === ownerId ? clone(inv) : null;
    },
    async listInvites(ownerId) {
      return [...data().invites.values()]
        .filter((i) => i.ownerId === ownerId)
        .map(clone);
    },
    async createInvite(ownerId, locale: Locale, opts) {
      const inv = seedInvite({ id: id(), ownerId, locale, blank: opts?.blank, orgId: opts?.orgId ?? null });
      let slug = inv.slug;
      let n = 2;
      while ([...data().invites.values()].some((i) => i.slug === slug)) {
        slug = `${inv.slug}-${n++}`;
      }
      inv.slug = slug;
      data().invites.set(inv.id, inv);
      return clone(inv);
    },
    async updateInvite(inviteId, ownerId, patch) {
      const inv = data().invites.get(inviteId);
      if (!inv || inv.ownerId !== ownerId) throw new Error("Not found");
      const next = { ...inv, ...patch, id: inv.id, ownerId: inv.ownerId, updatedAt: new Date().toISOString() };
      data().invites.set(inviteId, next);
      return clone(next);
    },
    async deleteInvite(inviteId, ownerId) {
      const inv = data().invites.get(inviteId);
      if (inv && inv.ownerId === ownerId) {
        data().invites.delete(inviteId);
        const d = data();
        d.rsvps = d.rsvps.filter((r) => r.inviteId !== inviteId);
      }
    },
    async slugTaken(slug, exceptId) {
      return [...data().invites.values()].some(
        (i) => i.slug === slug && i.id !== exceptId,
      );
    },

    async countRecentSubmissions(kind, ipHash, sinceIso) {
      const since = Date.parse(sinceIso);
      return data().submissions.filter(
        (x) => x.kind === kind && x.ipHash === ipHash && x.at >= since,
      ).length;
    },


    /* --- Organisations -------------------------------------------------- */
    async ensureOrg(ownerId, defaults) {
      const d = data();
      const found = d.members.find((m) => m.userId === ownerId);
      if (found) return clone(d.orgs.get(found.orgId)!);

      let slug = defaults.slug;
      for (let n = 2; [...d.orgs.values()].some((o) => o.slug === slug); n++) {
        slug = `${defaults.slug}-${n}`;
      }
      const org: Organization = {
        id: id(), name: defaults.name, slug, logoUrl: "", website: "", phone: "",
        plan: "basis", createdAt: new Date().toISOString(),
      };
      d.orgs.set(org.id, org);
      d.members.push({ orgId: org.id, userId: ownerId });
      return clone(org);
    },
    async getOrg(orgId) {
      const o = data().orgs.get(orgId);
      return o ? clone(o) : null;
    },
    async getOrgBySlug(slug) {
      for (const o of data().orgs.values()) if (o.slug === slug) return clone(o);
      return null;
    },
    async updateOrg(orgId, ownerId, patch) {
      const d = data();
      if (!d.members.some((m) => m.orgId === orgId && m.userId === ownerId)) {
        throw new Error("Not found");
      }
      const org = d.orgs.get(orgId);
      if (!org) throw new Error("Not found");
      const next = { ...org, ...patch, id: org.id, createdAt: org.createdAt };
      d.orgs.set(orgId, next);
      return clone(next);
    },
    async orgSlugTaken(slug, exceptId) {
      return [...data().orgs.values()].some((o) => o.slug === slug && o.id !== exceptId);
    },
    async countOrgInvites(orgId) {
      return [...data().invites.values()].filter((i) => i.orgId === orgId).length;
    },

    /* --- Guest lists ---------------------------------------------------- */
    async listGuests(inviteId, ownerId) {
      const inv = data().invites.get(inviteId);
      if (!inv || inv.ownerId !== ownerId) return [];
      return data().guests.filter((g2) => g2.inviteId === inviteId)
        .sort((a, b) => a.sort - b.sort).map(clone);
    },
    async replaceGuests(inviteId, ownerId, guests) {
      const d = data();
      const inv = d.invites.get(inviteId);
      if (!inv || inv.ownerId !== ownerId) throw new Error("Not found");
      const kept = new Set(guests.map((g2) => g2.id));
      // Replies belonging to removed households go with them.
      d.rsvps = d.rsvps.filter((r) => !r.guestId || kept.has(r.guestId));
      d.reminders = d.reminders.filter((r) => kept.has(r.guestId));
      d.guests = d.guests.filter((g2) => g2.inviteId !== inviteId);
      d.guests.push(...guests.map((g2, i) => ({ ...g2, inviteId, sort: i })));
      return guests.map(clone);
    },
    async getGuestByToken(inviteId, token) {
      const g2 = data().guests.find((x) => x.inviteId === inviteId && x.token === token);
      return g2 ? clone(g2) : null;
    },

    /* --- Reminders ------------------------------------------------------ */
    async remindersDue(nowIso) {
      const d = data();
      const now = Date.parse(nowIso);
      const out: DueReminder[] = [];

      for (const invite of d.invites.values()) {
        if (invite.status !== "published") continue;
        const anchor = reminderAnchor(invite);
        if (anchor === null) continue;

        const guests = d.guests.filter((g2) => g2.inviteId === invite.id);
        for (const guest of guests) {
          if (d.rsvps.some((r) => r.guestId === guest.id)) continue;
          for (const kind of REMINDER_KINDS) {
            const dueAt = anchor - REMINDER_DAYS[kind] * 86_400_000;
            if (now < dueAt) continue;
            const already = d.reminders.some(
              (r) => r.guestId === guest.id && r.kind === kind && r.sentAt,
            );
            if (already) continue;
            out.push({
              invite: clone(invite),
              org: invite.orgId ? clone(d.orgs.get(invite.orgId) ?? null) : null,
              guest: clone(guest),
              kind,
            });
          }
        }
      }
      return out;
    },
    async listReminders(inviteId, ownerId) {
      const d = data();
      const inv = d.invites.get(inviteId);
      if (!inv || inv.ownerId !== ownerId) return [];
      const ids = new Set(d.guests.filter((g2) => g2.inviteId === inviteId).map((g2) => g2.id));
      return d.reminders.filter((r) => ids.has(r.guestId)).map(clone);
    },
    async markReminded(guestId, kind, channel, sentAtIso) {
      const d = data();
      const hit = d.reminders.find(
        (r) => r.guestId === guestId && r.kind === kind && r.channel === channel,
      );
      if (hit) hit.sentAt = sentAtIso;
      else d.reminders.push({ id: id(), guestId, kind, channel, sentAt: sentAtIso });
    },
    async addRsvp(inviteId, r: NewRsvp) {
      if (r.guestId) {
        data().rsvps = data().rsvps.filter((x) => x.guestId !== r.guestId);
      }
      const { ipHash, guestId, ...rest } = r;
      data().rsvps.push({
        id: id(), inviteId, guestId: guestId ?? null, ...rest,
        createdAt: new Date().toISOString(),
      });
      if (ipHash) data().submissions.push({ kind: "rsvps", ipHash, at: Date.now() });
    },
    async listRsvps(inviteId, ownerId) {
      const inv = data().invites.get(inviteId);
      if (!inv || inv.ownerId !== ownerId) return [];
      return data().rsvps.filter((r) => r.inviteId === inviteId).map(clone);
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
