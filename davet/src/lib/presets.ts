import type { Locale } from "./types";

/**
 * Event names resolve per locale, so switching an invitation's language
 * relabels the programme without retyping. Free text always overrides.
 */
export const EVENT_PRESETS: Record<string, Record<Locale, string>> = {
  nikah: { en: "Nikah Ceremony", de: "Nikah-Zeremonie", tr: "Nikâh Töreni" },
  walima: { en: "Walima", de: "Walima", tr: "Velime" },
  reception: { en: "Wedding Reception", de: "Hochzeitsempfang", tr: "Düğün" },
  henna: { en: "Henna Night", de: "Henna-Abend", tr: "Kına Gecesi" },
  engagement: { en: "Engagement", de: "Verlobung", tr: "Nişan" },
  civil: {
    en: "Civil Ceremony",
    de: "Standesamtliche Trauung",
    tr: "Resmî Nikâh",
  },
};

export const PRESET_KEYS = Object.keys(EVENT_PRESETS);

export function eventName(
  presetKey: string | null,
  customName: string | null,
  locale: Locale,
): string {
  if (customName && customName.trim()) return customName;
  if (presetKey && EVENT_PRESETS[presetKey]) {
    return EVENT_PRESETS[presetKey][locale];
  }
  return "";
}
