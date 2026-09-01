import { describe, expect, it } from "vitest";
import { CATALOGUES, messagesFor } from "../src/lib/i18n";
import { LOCALES, THEME_IDS, TRADITIONS } from "../src/lib/types";
import { EVENT_PRESETS } from "../src/lib/presets";
import { VERSE_LIBRARY, VERSES_BY_KEY, versesFor } from "../src/lib/verses";
import { seedInvite } from "../src/lib/seed";

function leaves(obj: unknown, prefix = ""): [string, string][] {
  if (typeof obj === "string") return [[prefix, obj]];
  if (obj && typeof obj === "object") {
    return Object.entries(obj).flatMap(([k, v]) =>
      leaves(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [];
}

describe("catalogue completeness", () => {
  const keys = Object.fromEntries(
    LOCALES.map((l) => [l, leaves(CATALOGUES[l]).map(([k]) => k).sort()]),
  );

  it("has the same keys in every language", () => {
    expect(keys.de).toEqual(keys.en);
    expect(keys.tr).toEqual(keys.en);
  });

  it("leaves nothing untranslated", () => {
    for (const l of LOCALES) {
      for (const [key, value] of leaves(CATALOGUES[l])) {
        expect(value.trim(), `${l}.${key}`).not.toBe("");
      }
    }
  });
});

describe("German is the overflow canary", () => {
  // Compounds like Standesamtliche Trauung are what break narrow mobile labels,
  // so the longest single word is asserted rather than left to visual QA.
  const longestWord = (l: "en" | "de" | "tr") =>
    Math.max(...leaves(CATALOGUES[l]).flatMap(([, v]) => v.split(/\s+/).map((w) => w.length)));

  it("keeps the longest label within a testable bound", () => {
    expect(longestWord("de")).toBeLessThanOrEqual(28);
  });
});

describe("content libraries cover every locale", () => {
  it("translates every event preset", () => {
    for (const [key, byLocale] of Object.entries(EVENT_PRESETS)) {
      for (const l of LOCALES) {
        expect(byLocale[l]?.trim(), `${key}.${l}`).toBeTruthy();
      }
    }
  });

  it("translates every verse in every tradition", () => {
    for (const v of VERSE_LIBRARY) {
      for (const l of LOCALES) {
        expect(v.text[l]?.trim(), `${v.key}.${l}`).toBeTruthy();
        expect(v.ref[l]?.trim(), `${v.key}.ref.${l}`).toBeTruthy();
      }
    }
  });

  it("ships every tradition, with Arabic only on the Qur'an verses", () => {
    for (const t of TRADITIONS) {
      expect(versesFor(t).length, t).toBeGreaterThanOrEqual(4);
    }
    for (const v of versesFor("islamic")) {
      expect(v.original?.trim(), v.key).toBeTruthy();
    }
    for (const v of versesFor("christian")) {
      expect(v.original, v.key).toBeNull();
    }
  });

  it("names the quote section per tradition in every language", () => {
    for (const l of LOCALES) {
      for (const t of TRADITIONS) {
        expect(CATALOGUES[l].verses.heading[t]?.trim(), `${l}.${t}`).toBeTruthy();
        expect(CATALOGUES[l].verses.source[t]?.trim(), `${l}.${t}`).toBeTruthy();
        // A subtitle about mercy over a line from Casablanca reads as a bug,
        // so these follow the tradition too.
        expect(CATALOGUES[l].verses.sub[t]?.trim(), `${l}.${t}`).toBeTruthy();
        expect(CATALOGUES[l].footer.withLove[t]?.trim(), `${l}.${t}`).toBeTruthy();
      }
    }
  });

  it("names every theme in every language", () => {
    for (const l of LOCALES) {
      for (const id of THEME_IDS) {
        const entry = CATALOGUES[l].ui.themes[id];
        expect(entry?.name?.trim(), `${l}.${id}.name`).toBeTruthy();
        expect(entry?.blurb?.trim(), `${l}.${id}.blurb`).toBeTruthy();
      }
    }
  });
});

describe("formal address", () => {
  // German and Turkish force du/Sie in every sentence addressed to a guest.
  // The overlay must replace those strings and leave headings alone.
  it("changes what a guest is called, in every language", () => {
    for (const l of LOCALES) {
      const informal = messagesFor(l, "informal");
      const formal = messagesFor(l, "formal");
      expect(formal.rsvp.willYouCome, l).not.toBe(informal.rsvp.willYouCome);
      expect(formal.rsvp.yourName, l).toBeTruthy();
      // Headings name a thing rather than address anyone, so they never move.
      expect(formal.events.heading, l).toBe(informal.events.heading);
      expect(formal.rsvp.heading, l).toBe(informal.rsvp.heading);
    }
  });

  it("leaves the informal catalogue untouched", () => {
    for (const l of LOCALES) {
      expect(messagesFor(l, "informal")).toEqual(CATALOGUES[l]);
    }
  });

  it("carries a seat hint that still interpolates", () => {
    for (const l of LOCALES) {
      expect(messagesFor(l, "formal").rsvp.seatsHint, l).toContain("{n}");
    }
  });
});

describe("a new invitation opens on quotes that match its tradition", () => {
  // The seed picks quotes by key. A typo, or a tradition added without a pair,
  // would otherwise surface as an empty section only once someone published.
  it("seeds two resolvable quotes of the right tradition", () => {
    for (const t of TRADITIONS) {
      const invite = seedInvite({
        id: "seed-test", ownerId: "owner", locale: "de", tradition: t,
      });
      expect(invite.verses.length, t).toBe(2);
      for (const v of invite.verses) {
        const lib = v.libraryKey ? VERSES_BY_KEY.get(v.libraryKey) : undefined;
        expect(lib, `${t}/${v.libraryKey}`).toBeDefined();
        expect(lib?.tradition, `${t}/${v.libraryKey}`).toBe(t);
      }
    }
  });
});
