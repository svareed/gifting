import { seedInvite } from "../seed";
import { DEFAULT_LOCALE } from "../i18n";
import { REMINDER_DAYS, REMINDER_KINDS } from "../types";
import type {
  Guest, Invite, Locale, Organization, Reminder, Rsvp,
} from "../types";
import { EXAMPLE_VENUE } from "../brand";
import { wallTimeToUtcIso } from "../datetime";
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

  const studio = studioOrg();
  const studioInvite = studioExample(studio.id);

  return {
    orgs: new Map([[org.id, org], [studio.id, studio]]),
    // Rosenhof stays first: ensureOrg returns the first membership it finds,
    // and the dashboard has always opened on the hall.
    members: [
      { orgId: org.id, userId: DEMO_OWNER },
      { orgId: studio.id, userId: DEMO_OWNER },
    ],
    invites: new Map([[invite.id, invite], [studioInvite.id, studioInvite]]),
    guests: [...guests, ...studioGuests(studioInvite.id)],
    reminders: [],
    rsvps: [],
    submissions: [],
  };
}

/* --- The studio example ---------------------------------------------------
 * The same product aimed at the other half of its market. A hall sells a room,
 * so its example is ornamented and centred on the ceremony; a photographer
 * sells a way of seeing, so hers is black and white, has no ornament at all,
 * and quotes Casablanca where the hall's quotes a sura. Both are seeded so
 * either can be shown without anyone having to imagine the difference.
 */

const TZ = "Europe/Berlin";

/**
 * The studio this demo is branded for. Deliberately NOT in brand.ts: that
 * file's placeholder ships to every real user, and its own rule is that seed
 * data must not carry a real company's name. This is one prospect's pitch,
 * so it lives with the demo data and is swapped per prospect.
 *
 * PLACEHOLDER — replace `website` and `phone` with the studio's real details
 * before sending this link to anyone.
 */
const PITCH_STUDIO = {
  name: "Vicioso Studios",
  slug: "vicioso",
  website: "https://www.viciosostudios.de",
  phone: "+49 40 5550188",
} as const;

function studioOrg(): Organization {
  return {
    id: "demo-studio",
    name: PITCH_STUDIO.name,
    slug: PITCH_STUDIO.slug,
    logoUrl: "",
    website: PITCH_STUDIO.website,
    phone: PITCH_STUDIO.phone,
    plan: "profi",
    createdAt: new Date().toISOString(),
  };
}

function studioExample(orgId: string): Invite {
  const iid = "demo-studio-invite";
  const inv = seedInvite({
    id: iid, ownerId: DEMO_OWNER, locale: "de",
    tradition: "secular", timezone: TZ, orgId,
  });
  // A fixed date rather than a rolling one: this example is the pitch, and the
  // pitch names a day. The countdown therefore runs out on 15.12.2026 and the
  // example reads as a past wedding after that — move the year when it does.
  const year = 2026;
  const at = (wall: string) => wallTimeToUtcIso(`${year}-${wall}`, TZ);

  inv.slug = "max-und-lena";
  inv.status = "published";
  inv.theme = "atelier-blanc";
  inv.opener = "tor";
  inv.partnerAName = "Max";
  inv.partnerBName = "Lena";
  inv.heroImage = "/beispiel/titel.jpg";
  inv.inviteCard = "/beispiel/moment.webp";
  // The gate is a pre-rendered clip rather than the CSS door. The poster is
  // the film's own first frame, so starting playback changes nothing on
  // screen. Cut in media/opener; see docs/opener-film.md.
  inv.openerFilm = "/beispiel/tor.mp4";
  inv.openerFilmPoster = "/beispiel/tor-poster.jpg";
  inv.openerFilmMobile = "/beispiel/tor-mobile.mp4";
  inv.openerFilmMobilePoster = "/beispiel/tor-mobile-poster.jpg";
  // brand: the studio's wordmark above the photograph and on the frame — the
  // whole reason a supplier pays for this rather than sending a PDF.
  inv.sections = { ...inv.sections, info: true, music: false, brand: true, blossom: true };
  inv.rsvpDeadline = `${year}-11-15`;
  inv.organizerName = PITCH_STUDIO.name;
  inv.organizerUrl = PITCH_STUDIO.website;
  inv.organizerPhone = PITCH_STUDIO.phone;

  inv.infoWeather =
    "Mitte Dezember an der Elbe: kalt und oft windig — Mantel, Schal und warme Schuhe "
    + "für den Weg zwischen den Häusern.";
  inv.infoDress =
    "Festlich, gern in gedämpften Tönen. Drinnen ist es warm, draußen nicht — "
    + "etwas zum Überziehen für den Übergang.";
  inv.infoParking =
    "Auf dem Gut gibt es Parkplätze. Ab 17:30 Uhr fährt ein Shuttle zum Elbspeicher und später zurück.";

  inv.families = [
    { id: `${iid}-f1`, side: "a", personName: "Max",
      parents: "Sohn von Andrea und Thomas Berger", grandparents: "" },
    { id: `${iid}-f2`, side: "b", personName: "Lena",
      parents: "Tochter von Petra und Michael Hoffmann", grandparents: "" },
  ];

  inv.events = [
    {
      id: `${iid}-e1`, sort: 0, presetKey: "freie-trauung", customName: null,
      venueName: "Gut Hohenholz", venueAddress: "Ahrensburg bei Hamburg",
      mapsUrl: "", startsAt: at("12-15T13:30"),
      note: "Trauung in der Remise, anschließend Sektempfang",
    },
    {
      id: `${iid}-e2`, sort: 1, presetKey: "reception", customName: null,
      venueName: "Elbspeicher Neumühlen", venueAddress: "Neumühlen, Hamburg",
      mapsUrl: "", startsAt: at("12-15T18:30"),
      note: "Dinner, Reden und Tanz",
    },
    // The studio's own slot, printed where every guest will read it. This is
    // the line that tells a photographer the product was built with her in mind.
    {
      id: `${iid}-e3`, sort: 2, presetKey: null,
      customName: "Paarshooting zur blauen Stunde",
      venueName: "Elbstrand Övelgönne", venueAddress: "Hamburg-Othmarschen",
      mapsUrl: "", startsAt: at("12-15T16:15"),
      note: "Wir sind eine Stunde weg — tanzt bitte weiter",
    },
  ];

  return inv;
}

function studioGuests(inviteId: string): Guest[] {
  return [
    { id: "sg1", inviteId, token: "schneider4m", household: "Familie Schneider",
      seats: 4, email: "", phone: "", sort: 0 },
    { id: "sg2", inviteId, token: "krueger2v", household: "Familie Krüger",
      seats: 2, email: "", phone: "", sort: 1 },
    { id: "sg3", inviteId, token: "jonas2b", household: "Jonas und Mareike",
      seats: 2, email: "", phone: "", sort: 2 },
  ];
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
