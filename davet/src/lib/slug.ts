import type { Locale } from "./types";

/**
 * The same character transliterates differently by language: German expands
 * "Müller" to "mueller", while Turkish "Gül" is "gul", not "guel". The
 * invitation already carries a locale, so the slug follows it.
 */
const BASE: Record<string, string> = {
  ä: "a", ö: "o", ü: "u", ß: "ss",
  ş: "s", ı: "i", İ: "i", ğ: "g", ç: "c",
  â: "a", î: "i", û: "u", é: "e", è: "e", ñ: "n", å: "a", ø: "o", æ: "ae",
};

const GERMAN: Record<string, string> = { ...BASE, ä: "ae", ö: "oe", ü: "ue" };

export const RESERVED_SLUGS = new Set([
  "api", "login", "logout", "auth", "dashboard", "edit", "preview", "new",
  "admin", "about", "pricing", "terms", "privacy", "help", "static", "_next",
]);

export function slugify(input: string, locale: Locale = "en"): string {
  const map = locale === "de" ? GERMAN : BASE;

  const folded = Array.from(input.toLowerCase())
    .map((ch) => map[ch] ?? ch)
    .join("");

  return folded
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function suggestSlug(
  partnerA: string,
  partnerB: string,
  locale: Locale = "en",
): string {
  return slugify(`${partnerA} ${partnerB}`.trim(), locale) || "our-wedding";
}

export function isSlugAvailableShape(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,59}$/.test(slug) && !RESERVED_SLUGS.has(slug);
}
