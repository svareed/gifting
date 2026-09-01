import { en } from "./en";
import { de } from "./de";
import { tr } from "./tr";
import { LOCALES, type AddressForm, type Locale } from "../types";
import type { Messages } from "./en";

export type { Messages };

export const CATALOGUES: Record<Locale, Messages> = { de, tr, en };

/** German is the product's home market; everything else is an opt-in. */
export const DEFAULT_LOCALE: Locale = "de";

/**
 * Where the chosen interface language is kept. A cookie rather than a path
 * segment: the invitation's own language is a property of the invitation, and
 * every published URL has to stay stable no matter who is reading the builder.
 */
export const UI_LOCALE_COOKIE = "davet_ui_locale";

/** Narrows an untrusted string (a cookie value, a form field) to a Locale. */
export function parseLocale(value: string | undefined | null): Locale | null {
  return LOCALES.includes(value as Locale) ? (value as Locale) : null;
}

export function messages(locale: Locale): Messages {
  return CATALOGUES[locale] ?? CATALOGUES[DEFAULT_LOCALE];
}

/**
 * The catalogue as a given invitation should speak it. Formal address is a
 * thin overlay: only the groups that address a guest are replaced, so a new
 * heading added to the informal catalogue never needs a formal twin.
 */
export function messagesFor(locale: Locale, addressForm: AddressForm): Messages {
  const base = messages(locale);
  if (addressForm !== "formal") return base;
  const f = base.formal;
  return {
    ...base,
    opener: { ...base.opener, ...f.opener },
    events: { ...base.events, ...f.events },
    rsvp: { ...base.rsvp, ...f.rsvp },
  };
}

export const LOCALE_NAMES: Record<Locale, string> = {
  de: "Deutsch",
  tr: "Türkçe",
  en: "English",
};

/** BCP-47 tag for the `lang` attribute. Turkish casing depends on this. */
export const HTML_LANG: Record<Locale, string> = {
  de: "de",
  tr: "tr",
  en: "en",
};
