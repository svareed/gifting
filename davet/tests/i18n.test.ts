import { describe, expect, it } from "vitest";
import { CATALOGUES } from "../src/lib/i18n";
import { LOCALES, TRADITIONS } from "../src/lib/types";
import { EVENT_PRESETS } from "../src/lib/presets";
import { VERSE_LIBRARY, versesFor } from "../src/lib/verses";

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

  it("translates every verse in both traditions", () => {
    for (const v of VERSE_LIBRARY) {
      for (const l of LOCALES) {
        expect(v.text[l]?.trim(), `${v.key}.${l}`).toBeTruthy();
        expect(v.ref[l]?.trim(), `${v.key}.ref.${l}`).toBeTruthy();
      }
    }
  });

  it("ships both traditions, with Arabic only on the Qur'an verses", () => {
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

  it("names the scripture section per tradition in every language", () => {
    for (const l of LOCALES) {
      for (const t of TRADITIONS) {
        expect(CATALOGUES[l].verses.heading[t]?.trim(), `${l}.${t}`).toBeTruthy();
        expect(CATALOGUES[l].verses.source[t]?.trim(), `${l}.${t}`).toBeTruthy();
      }
    }
  });
});
