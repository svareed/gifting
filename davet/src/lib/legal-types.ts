/** Split out so the page shell can import types without pulling in the text. */
export type { Locale } from "./types";
export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; updated: string; sections: LegalSection[] };
