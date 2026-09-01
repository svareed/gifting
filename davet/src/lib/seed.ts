import { wallTimeToUtcIso } from "./datetime";
import { suggestSlug } from "./slug";
import type { Invite, Locale, SectionKey, Tradition } from "./types";

/**
 * A new invitation is never blank by default. It arrives as a complete, working
 * example in the chosen language, turning the user's task from creating into
 * editing. `blank: true` keeps the structure and drops the words, for people
 * who would rather start from nothing.
 */

const SEED_TEXT: Record<
  Locale,
  { a: string; b: string; weather: string; dress: string; parking: string; note1: string; note2: string; parentsA: string; parentsB: string }
> = {
  en: {
    a: "Amir",
    b: "Leyla",
    weather: "Warm and dry, with cool evenings. A light shawl is a good idea.",
    dress: "Traditional or elegant formal wear is warmly encouraged.",
    parking: "On-site parking is available. Arriving a little early is recommended.",
    note1: "Nikah, followed by lunch",
    note2: "Reception and dinner",
    parentsA: "Son of",
    parentsB: "Daughter of",
  },
  de: {
    a: "Amir",
    b: "Leyla",
    weather: "Warm und trocken, abends kühl. Ein leichter Schal lohnt sich.",
    dress: "Traditionelle oder elegante festliche Kleidung ist herzlich willkommen.",
    parking: "Parkplätze sind vor Ort vorhanden. Etwas früher da zu sein, lohnt sich.",
    note1: "Nikah, anschliessend Mittagessen",
    note2: "Empfang und Abendessen",
    parentsA: "Sohn von",
    parentsB: "Tochter von",
  },
  tr: {
    a: "Amir",
    b: "Leyla",
    weather: "Sıcak ve kuru, akşamları serin. İnce bir şal iyi olur.",
    dress: "Geleneksel ya da şık resmî kıyafet memnuniyetle karşılanır.",
    parking: "Mekânda otopark mevcuttur. Biraz erken gelmenizi öneririz.",
    note1: "Nikâh, ardından öğle yemeği",
    note2: "Karşılama ve akşam yemeği",
    parentsA: "Oğlu",
    parentsB: "Kızı",
  },
};

/** Venue placeholders are language-independent, so they live outside SEED_TEXT. */
const SEED_VENUES = [
  { venueName: "Merkez Camii", venueAddress: "Köln, Deutschland" },
  { venueName: "Sala Ballsaal", venueAddress: "Düsseldorf, Deutschland" },
] as const;

const norm = (v: string) => v.trim().toLowerCase();

/**
 * Every string the seed can put in front of a couple, in every language. The
 * builder marks a field as an example while its value is still one of these,
 * so nobody has to guess which words are theirs and which are ours. All
 * locales are compared, not just the current one, because switching the
 * invitation's language leaves the already-seeded text in place.
 */
const SEED_VALUES: ReadonlySet<string> = new Set(
  [
    ...Object.values(SEED_TEXT).flatMap((t) => [
      t.a, t.b, t.weather, t.dress, t.parking, t.note1, t.note2,
      `${t.parentsA} …`, `${t.parentsB} …`,
    ]),
    ...SEED_VENUES.flatMap((v) => [v.venueName, v.venueAddress]),
  ].map(norm),
);

/**
 * A field still holding example text. A couple genuinely called Amir gets the
 * mark too, which is why it reads as an offer to clear the field rather than
 * as a warning, and why `blank: true` exists for people who would rather start
 * from nothing.
 */
export function isSeedValue(value: string): boolean {
  return value.trim() !== "" && SEED_VALUES.has(norm(value));
}

/** True while nothing that identifies this wedding has been typed yet. */
export function isUntouchedExample(invite: {
  partnerAName: string;
  partnerBName: string;
  events: { venueName: string }[];
}): boolean {
  return (
    isSeedValue(invite.partnerAName) &&
    isSeedValue(invite.partnerBName) &&
    invite.events.every((e) => e.venueName === "" || isSeedValue(e.venueName))
  );
}

/**
 * The pair a new invitation opens with. A Record over Tradition, so adding a
 * tradition without choosing its opening quotes is a compile error rather than
 * an empty section nobody notices until a couple publishes.
 */
const SEED_VERSE_KEYS: Record<Tradition, [string, string]> = {
  islamic: ["ar-rum-30-21", "an-naba-78-8"],
  christian: ["1-cor-13-4", "mark-10-9"],
  secular: ["casablanca-augen", "goethe-verweile"],
};

const DEFAULT_SECTIONS: Record<SectionKey, boolean> = {
  events: true,
  families: true,
  verses: true,
  rsvp: true,
  // Off by default: most couples have nothing to put here yet, and an empty
  // "things to know" reads as an unfinished invitation.
  info: false,
  music: false,
  // Opt-in: a couple's own invitation should not carry a supplier's wordmark
  // unless the supplier is the one who made it.
  brand: false,
  blossom: false,
};

export function seedInvite(opts: {
  id: string;
  ownerId: string;
  locale: Locale;
  tradition?: Tradition;
  timezone?: string;
  now?: Date;
  /** Keeps the structure and the dates, drops every word we would put in. */
  blank?: boolean;
  /** The venue this invitation belongs to. */
  orgId?: string | null;
}): Invite {
  const { id, ownerId, locale } = opts;
  const blank = opts.blank ?? false;
  /** Empty in blank mode, the worked example otherwise. */
  const ex = <T extends string>(value: T) => (blank ? ("" as const) : value);
  const tradition = opts.tradition ?? "islamic";
  const timezone = opts.timezone ?? "Europe/Berlin";
  const t = SEED_TEXT[locale];

  // Default to a date far enough out that the countdown reads sensibly.
  const now = opts.now ?? new Date();
  const year = now.getUTCFullYear() + 1;

  return {
    id,
    ownerId,
    orgId: opts.orgId ?? null,
    slug: suggestSlug(ex(t.a), ex(t.b), locale),
    status: "draft",
    slugLocked: false,
    locale,
    tradition,
    addressForm: "informal",
    theme: "ivory-gold",
    opener: "veil",
    timezone,
    partnerAName: ex(t.a),
    partnerBName: ex(t.b),
    heroImage: null,
    inviteCard: null,
    sections: { ...DEFAULT_SECTIONS },
    rsvpDeadline: `${year}-05-30`,
    organizerName: ex(SEED_VENUES[1].venueName),
    organizerUrl: "",
    organizerPhone: "",
    infoWeather: ex(t.weather),
    infoDress: ex(t.dress),
    infoParking: ex(t.parking),
    events: [
      {
        id: `${id}-e1`,
        sort: 0,
        presetKey: "nikah",
        customName: null,
        venueName: ex(SEED_VENUES[0].venueName),
        venueAddress: ex(SEED_VENUES[0].venueAddress),
        mapsUrl: "",
        startsAt: wallTimeToUtcIso(`${year}-06-12T12:00`, timezone),
        note: ex(t.note1),
      },
      {
        id: `${id}-e2`,
        sort: 1,
        presetKey: "reception",
        customName: null,
        venueName: ex(SEED_VENUES[1].venueName),
        venueAddress: ex(SEED_VENUES[1].venueAddress),
        mapsUrl: "",
        startsAt: wallTimeToUtcIso(`${year}-06-13T18:00`, timezone),
        note: ex(t.note2),
      },
    ],
    families: [
      {
        id: `${id}-f1`,
        side: "a",
        personName: ex(t.a),
        parents: blank ? "" : `${t.parentsA} …`,
        grandparents: "",
      },
      {
        id: `${id}-f2`,
        side: "b",
        personName: ex(t.b),
        parents: blank ? "" : `${t.parentsB} …`,
        grandparents: "",
      },
    ],
    verses: SEED_VERSE_KEYS[tradition].map((libraryKey, i) => ({
      id: `${id}-v${i + 1}`,
      sort: i,
      libraryKey,
      customArabic: null,
      customText: null,
      customRef: null,
    })),
    updatedAt: new Date().toISOString(),
  };
}
