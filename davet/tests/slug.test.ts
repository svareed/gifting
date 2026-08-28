import { describe, expect, it } from "vitest";
import { isSlugAvailableShape, slugify, suggestSlug } from "../src/lib/slug";

describe("slugify", () => {
  it("expands umlauts the German way for a German invitation", () => {
    expect(slugify("Müller & Schäfer", "de")).toBe("mueller-schaefer");
    expect(slugify("Weiß", "de")).toBe("weiss");
  });

  it("folds the same umlaut plainly for a Turkish invitation", () => {
    // The identical character, two correct answers: locale decides.
    expect(slugify("Gül", "tr")).toBe("gul");
    expect(slugify("Gül", "de")).toBe("guel");
  });

  it("transliterates Turkish, including dotted and dotless I", () => {
    expect(slugify("Işık", "tr")).toBe("isik");
    expect(slugify("Çağrı & Gül", "tr")).toBe("cagri-gul");
  });

  it("never emits leading or trailing separators", () => {
    expect(slugify("  ---Amir---  ")).toBe("amir");
  });

  it("falls back when a name transliterates to nothing", () => {
    expect(suggestSlug("", "")).toBe("our-wedding");
  });
});

describe("slug shape", () => {
  it("rejects reserved paths that would shadow the app", () => {
    for (const s of ["api", "dashboard", "edit", "login"]) {
      expect(isSlugAvailableShape(s)).toBe(false);
    }
  });

  it("accepts an ordinary couple slug", () => {
    expect(isSlugAvailableShape("amir-leyla")).toBe(true);
  });

  it("rejects anything that is not lowercase url-safe", () => {
    expect(isSlugAvailableShape("Amir Leyla")).toBe(false);
    expect(isSlugAvailableShape("a")).toBe(false);
  });
});
