import type { Locale } from "./types";

/**
 * Safari parses `new Date("2026-08-27 12:00")` as Invalid Date while Chrome
 * accepts it. Every timestamp in Davet is a strict ISO-8601 UTC instant, and
 * this module is the only place allowed to build or read one.
 */

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?Z$/;
const WALL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const INTL_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  de: "de-DE",
  tr: "tr-TR",
};

export function parseUtcIso(iso: string): Date {
  if (!ISO_UTC.test(iso)) {
    throw new Error(`Not a UTC ISO-8601 instant: ${iso}`);
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Unparseable instant: ${iso}`);
  return d;
}

/** Milliseconds a zone is ahead of UTC at the given instant. */
function zoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  // Some engines render midnight as hour "24" under hour12:false.
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - utcMs;
}

/**
 * "2026-08-27T12:00" in Europe/Berlin -> "2026-08-27T10:00:00.000Z".
 * Two passes so the result stays correct across a DST transition.
 */
export function wallTimeToUtcIso(wall: string, timeZone: string): string {
  const m = WALL.exec(wall);
  if (!m) throw new Error(`Expected YYYY-MM-DDTHH:mm, got: ${wall}`);
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);

  let utcMs = naive;
  for (let i = 0; i < 2; i++) utcMs = naive - zoneOffsetMs(utcMs, timeZone);
  return new Date(utcMs).toISOString();
}

/** Inverse of wallTimeToUtcIso, for populating a datetime-local input. */
export function utcIsoToWallTime(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(parseUtcIso(iso));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = String(Number(get("hour")) % 24).padStart(2, "0");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export function formatEventDate(
  iso: string,
  locale: Locale,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseUtcIso(iso));
}

export function formatEventTime(
  iso: string,
  locale: Locale,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(parseUtcIso(iso));
}

export function formatShortDate(
  iso: string,
  locale: Locale,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseUtcIso(iso));
}

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

/**
 * Counts down to one absolute instant, so a guest in Berlin and a guest in
 * Kochi see the same remaining time.
 */
export function countdown(targetIso: string, nowMs: number): Countdown {
  const diff = parseUtcIso(targetIso).getTime() - nowMs;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };

  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    done: false,
  };
}
