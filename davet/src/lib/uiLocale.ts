import { cookies } from "next/headers";
import { DEFAULT_LOCALE, UI_LOCALE_COOKIE, parseLocale } from "./i18n";
import type { Locale } from "./types";

/**
 * The language the app itself speaks, which is not the same thing as the
 * language an invitation is written in: a German couple may well be building a
 * Turkish invitation. Server components read this; LocaleSwitch writes the
 * cookie and refreshes, so the page re-renders translated rather than being
 * swapped out in the browser.
 *
 * Reading a cookie opts every caller into dynamic rendering. That is the price
 * of server-rendered language switching, and these pages are small.
 */
export async function uiLocale(): Promise<Locale> {
  const jar = await cookies();
  return parseLocale(jar.get(UI_LOCALE_COOKIE)?.value) ?? DEFAULT_LOCALE;
}
