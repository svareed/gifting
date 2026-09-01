export const LOCALES = ["de", "tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const THEME_IDS = [
  "ivory-gold",
  "onyx-champagne",
  "emerald-brass",
  "iznik-blue",
  "marble-gilt",
  "rosewater",
  "sand-terracotta",
  "kasavu",
  "atelier-blanc",
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

/**
 * How the invitation arrives. "tor" is the cinematic one: two leaves part over
 * the cover photograph while it settles out of a slow push-in. It needs a
 * hero image to open onto and falls back to "veil" without one.
 */
export const OPENER_IDS = ["veil", "foil", "envelope", "direct", "tor"] as const;
export type OpenerId = (typeof OPENER_IDS)[number];

/**
 * Chooses the quote library and the quote section's heading. "secular" is not
 * an absence of tradition — it is the German default: most couples marrying
 * here want a line from a film or a poem, not scripture, and until this existed
 * they had to type one in by hand.
 */
export const TRADITIONS = ["islamic", "christian", "secular"] as const;

/**
 * How the invitation speaks to its guests. German and Turkish both force the
 * choice in every sentence: "Kommst du?" to the couple's friends, "Kommen
 * Sie?" to an employer or a great-aunt. Getting it wrong is not a tone
 * problem, it is a rudeness problem, so it is the invitation's decision
 * rather than the product's.
 */
export const ADDRESS_FORMS = ["informal", "formal"] as const;
export type AddressForm = (typeof ADDRESS_FORMS)[number];
export type Tradition = (typeof TRADITIONS)[number];

export type SectionKey =
  | "families"
  | "verses"
  | "events"
  | "rsvp"
  | "info"
  | "music"
  /** The studio's or hall's wordmark, set above the cover photograph. */
  | "brand"
  /** Orchard blossom drifting over the page. Ambient, opt-in, never load-bearing. */
  | "blossom";

export type InviteEvent = {
  id: string;
  sort: number;
  /** Preset key resolved per locale, or null when customName is used. */
  presetKey: string | null;
  customName: string | null;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  /** ISO-8601 UTC instant. Never a bare "YYYY-MM-DD HH:mm" string. */
  startsAt: string;
  note: string;
};

export type Family = {
  id: string;
  side: "a" | "b";
  personName: string;
  parents: string;
  grandparents: string;
};

export type Verse = {
  id: string;
  sort: number;
  /** Key into the verse library, or null when the couple supplied their own. */
  libraryKey: string | null;
  /** Original-script line (Arabic for Qur'an verses); absent for most others. */
  customArabic: string | null;
  customText: string | null;
  customRef: string | null;
};

export type Invite = {
  id: string;
  ownerId: string;
  /** The venue or planner this invitation belongs to. */
  orgId: string | null;
  slug: string;
  status: "draft" | "published";
  /**
   * False while the slug tracks the couple's names. Set once someone edits the
   * address by hand, and effectively frozen at publish so links already sent
   * to guests keep working.
   */
  slugLocked: boolean;
  locale: Locale;
  /** Chooses the verse library and the scripture section's heading. */
  tradition: Tradition;
  /** du/Sie, sen/siz. Only affects words shown to guests. */
  addressForm: AddressForm;
  theme: ThemeId;
  opener: OpenerId;
  /** IANA zone, e.g. "Europe/Berlin". Anchors every countdown. */
  timezone: string;
  partnerAName: string;
  partnerBName: string;
  heroImage: string | null;
  /** An optional pre-rendered opening for the "tor" gate, and its own
   *  first frame. Optional so no existing row or seed has to carry it. */
  openerFilm?: string | null;
  openerFilmPoster?: string | null;
  /** A portrait cut of the same opening, for screens taller than they are
   *  wide. Without it a portrait screen letterboxes the landscape master
   *  rather than cropping the doors out of frame. */
  openerFilmMobile?: string | null;
  openerFilmMobilePoster?: string | null;
  inviteCard: string | null;
  sections: Record<SectionKey, boolean>;
  rsvpDeadline: string | null;
  /**
   * Whoever is putting the day on. Rendered at the foot of the invitation,
   * where every guest ends up — which is the whole point for a venue paying
   * for the tool.
   */
  organizerName: string;
  organizerUrl: string;
  organizerPhone: string;
  infoWeather: string;
  infoDress: string;
  infoParking: string;
  events: InviteEvent[];
  families: Family[];
  verses: Verse[];
  updatedAt: string;
};

export type Rsvp = {
  id: string;
  inviteId: string;
  /** Null for a reply that arrived through the open link rather than a
   *  household one. Only household replies count toward a seat allowance. */
  guestId: string | null;
  name: string;
  attending: boolean;
  guestCount: number;
  message: string;
  createdAt: string;
};


export const PLANS = ["basis", "profi", "gruppe"] as const;
export type Plan = (typeof PLANS)[number];

/** Invitations a plan may hold at once. -1 is unlimited. */
export const PLAN_QUOTA: Record<Plan, number> = {
  basis: 15,
  profi: -1,
  gruppe: -1,
};

/**
 * The venue or planner the invitations belong to. Every invitation hangs off
 * one, so branding, quota and billing have somewhere to live that is not an
 * individual login — which is what "unlimited for the hall" has to mean.
 */
export type Organization = {
  id: string;
  name: string;
  /** Subdomain label: rosenhof -> rosenhof.davet.de. Unique across the app. */
  slug: string;
  logoUrl: string;
  website: string;
  phone: string;
  plan: Plan;
  createdAt: string;
};

/**
 * One household on the guest list. The token is the whole access story: a
 * household follows its own link, so a headcount is a sum of named seats
 * rather than a count of strangers who happened to open the invitation.
 */
export type Guest = {
  id: string;
  inviteId: string;
  token: string;
  household: string;
  /** Seats reserved for this household. Caps what the RSVP form will accept. */
  seats: number;
  email: string;
  phone: string;
  sort: number;
};

export const REMINDER_KINDS = ["t14", "t7"] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export const REMINDER_DAYS: Record<ReminderKind, number> = { t14: 14, t7: 7 };

export type ReminderChannel = "email" | "whatsapp";

/** One reminder that is due, or has already gone out, for one household. */
export type Reminder = {
  id: string;
  guestId: string;
  kind: ReminderKind;
  channel: ReminderChannel;
  sentAt: string | null;
};
