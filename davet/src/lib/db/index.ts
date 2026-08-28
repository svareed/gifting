import type {
  Guest, Invite, Locale, Organization, Reminder, ReminderChannel,
  ReminderKind, Rsvp,
} from "../types";

export type DueReminder = {
  invite: Invite;
  org: Organization | null;
  guest: Guest;
  kind: ReminderKind;
};

export type NewRsvp = {
  name: string;
  attending: boolean;
  guestCount: number;
  message: string;
  /** Set when the reply came through a household link. */
  guestId?: string | null;
  /** Salted hash, never the address itself, and purged with the response. */
  ipHash: string | null;
};


export type SubmissionKind = "rsvps";

export interface Store {
  /** Cross-instance abuse counting; per-process counters do not survive Vercel. */
  countRecentSubmissions(
    kind: SubmissionKind,
    ipHash: string,
    sinceIso: string,
  ): Promise<number>;

  /** Public read. Returns null for drafts, so a draft slug 404s for guests. */
  getPublishedBySlug(slug: string): Promise<Invite | null>;
  /** Guest writes are accepted only for invitations that are published. */
  getPublishedById(id: string): Promise<Invite | null>;
  getInvite(id: string, ownerId: string): Promise<Invite | null>;
  listInvites(ownerId: string): Promise<Invite[]>;
  createInvite(
    ownerId: string,
    locale: Locale,
    opts?: { blank?: boolean; orgId?: string | null },
  ): Promise<Invite>;
  updateInvite(id: string, ownerId: string, patch: Partial<Invite>): Promise<Invite>;
  deleteInvite(id: string, ownerId: string): Promise<void>;
  slugTaken(slug: string, exceptId: string): Promise<boolean>;

  /* --- Organisations ---------------------------------------------------- */
  /** The org this person belongs to, created on first use so nobody has to
   *  complete a setup wizard before seeing the product work. */
  ensureOrg(ownerId: string, defaults: { name: string; slug: string }): Promise<Organization>;
  getOrg(orgId: string): Promise<Organization | null>;
  getOrgBySlug(slug: string): Promise<Organization | null>;
  updateOrg(orgId: string, ownerId: string, patch: Partial<Organization>): Promise<Organization>;
  orgSlugTaken(slug: string, exceptId: string): Promise<boolean>;
  countOrgInvites(orgId: string): Promise<number>;

  /* --- Guest lists ------------------------------------------------------- */
  listGuests(inviteId: string, ownerId: string): Promise<Guest[]>;
  replaceGuests(inviteId: string, ownerId: string, guests: Guest[]): Promise<Guest[]>;
  /** Public read by token. Guests never see each other's rows. */
  getGuestByToken(inviteId: string, token: string): Promise<Guest | null>;

  /* --- Reminders --------------------------------------------------------- */
  /** Households that have not replied, on invitations whose reminder date has
   *  passed. Computed rather than queued, so a changed date is respected. */
  remindersDue(nowIso: string): Promise<DueReminder[]>;
  listReminders(inviteId: string, ownerId: string): Promise<Reminder[]>;
  markReminded(
    guestId: string, kind: ReminderKind, channel: ReminderChannel, sentAtIso: string,
  ): Promise<void>;

  addRsvp(inviteId: string, data: NewRsvp): Promise<void>;
  listRsvps(inviteId: string, ownerId: string): Promise<Rsvp[]>;
  countRsvps(inviteId: string, ownerId: string): Promise<{ yes: number; no: number; guests: number }>;

}

export const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

let cached: Store | null = null;

/**
 * The demo store lives in process memory. On Vercel every request may land on a
 * different serverless instance, so invitations would appear and vanish at
 * random. That is worse than an outage because it looks like it works. Fail
 * loudly instead, unless someone opts in deliberately.
 */
function assertStoreIsDeployable(): void {
  const demoAllowed = process.env.ALLOW_DEMO_IN_PRODUCTION === "1";
  if (process.env.NODE_ENV === "production" && !SUPABASE_CONFIGURED && !demoAllowed) {
    throw new Error(
      "Davet is running in production without Supabase credentials. The demo " +
        "store keeps data in process memory and cannot survive serverless " +
        "instances. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "and SUPABASE_SERVICE_ROLE_KEY, or set ALLOW_DEMO_IN_PRODUCTION=1 to " +
        "run a throwaway demo knowingly.",
    );
  }
}

export async function store(): Promise<Store> {
  if (cached) return cached;
  assertStoreIsDeployable();
  if (SUPABASE_CONFIGURED) {
    const { supabaseStore } = await import("./supabase");
    cached = supabaseStore();
  } else {
    const { demoStore } = await import("./demo");
    cached = demoStore();
  }
  return cached;
}
