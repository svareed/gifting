import type { ThemeId } from "./types";

/**
 * A theme is a token bundle, not a template. Adding one is a data change:
 * append an entry here, add its name and blurb to the message catalogues, and
 * it appears in the picker, the renderer, and the OG image with no other edits.
 */

export type FontPairing = "classic" | "deco" | "modern" | "garamond" | "editorial";
export type Ornament = "diamond" | "tile" | "leaf" | "deco" | "weave" | "none";
export type Surface = "grain" | "marble" | "linen" | "plaster" | "none";
export type Motion = "veil" | "fade-rise" | "none";

/**
 * How the display face is set. One named decision rather than four loose knobs,
 * because these only ever move together: a title-case serif wants a tight fit,
 * an italic ampersand and a foil sheen across the letterforms, while tracked
 * caps want air, an upright ampersand and flat ink — a theme whose accent is
 * ink rather than a metal has no foil to catch the light.
 */
export type Lettering = "titlecase" | "tracked-caps";

/**
 * Whether content sits inside framed cards or directly on the ground. "open"
 * is the editorial treatment: no boxes, no tiles, no pills — separation is
 * space and hairlines only. Boxes are what make a page read as a web form
 * rather than as print, so this is the single biggest lever on how expensive
 * an invitation looks.
 */
export type Chrome = "framed" | "open";

const LETTERING: Record<
  Lettering,
  { case: string; track: string; amp: string; giltFill: string }
> = {
  titlecase: {
    case: "none", track: "-0.01em", amp: "italic", giltFill: "transparent",
  },
  "tracked-caps": {
    case: "uppercase", track: ".1em", amp: "normal", giltFill: "var(--ink)",
  },
};

export type Palette = {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  rule: string;
  onAccent: string;
};

export type Theme = {
  id: ThemeId;
  /** Name and blurb are translated, so they live in the message catalogues. */
  dark: boolean;
  palette: Palette;
  fonts: FontPairing;
  ornament: Ornament;
  surface: Surface;
  motion: Motion;
  /** Defaults to "titlecase", which is how every ornamented theme is set. */
  lettering?: Lettering;
  /** Defaults to "framed". */
  chrome?: Chrome;
};

/** Only the active theme's families are ever painted, so only those download. */
export const FONT_STACKS: Record<
  FontPairing,
  { display: string; body: string }
> = {
  classic: { display: "var(--f-cormorant)", body: "var(--f-jost)" },
  deco: { display: "var(--f-cinzel)", body: "var(--f-jost)" },
  modern: { display: "var(--f-playfair)", body: "var(--f-outfit)" },
  garamond: { display: "var(--f-ebgaramond)", body: "var(--f-outfit)" },
  editorial: { display: "var(--f-italiana)", body: "var(--f-jost)" },
};

export const THEMES: Record<ThemeId, Theme> = {
  "ivory-gold": {
    id: "ivory-gold",
    dark: false,
    fonts: "classic",
    ornament: "diamond",
    surface: "grain",
    motion: "veil",
    palette: {
      bg: "#FBF8F1",
      surface: "#FFFFFF",
      ink: "#2A2520",
      muted: "#7A6E60",
      accent: "#B08D3F",
      accentSoft: "#EFE5CD",
      rule: "#D9C89A",
      onAccent: "#FFFDF7",
    },
  },
  "onyx-champagne": {
    id: "onyx-champagne",
    dark: true,
    fonts: "deco",
    ornament: "deco",
    surface: "none",
    motion: "veil",
    palette: {
      bg: "#0E0E10",
      surface: "#17171A",
      ink: "#F2ECE2",
      muted: "#A39B8E",
      accent: "#D8BE84",
      accentSoft: "#2A2620",
      rule: "#4A4335",
      onAccent: "#14120D",
    },
  },
  "emerald-brass": {
    id: "emerald-brass",
    dark: false,
    fonts: "garamond",
    ornament: "leaf",
    surface: "linen",
    motion: "fade-rise",
    palette: {
      bg: "#F3F6F2",
      surface: "#FFFFFF",
      ink: "#12241B",
      muted: "#5D7266",
      accent: "#0F5132",
      accentSoft: "#D8E8DE",
      rule: "#A98C4B",
      onAccent: "#F7FBF8",
    },
  },
  "iznik-blue": {
    id: "iznik-blue",
    dark: false,
    fonts: "classic",
    ornament: "tile",
    surface: "none",
    motion: "fade-rise",
    palette: {
      bg: "#F7FAFC",
      surface: "#FFFFFF",
      ink: "#14283C",
      muted: "#5A7189",
      accent: "#1E5AA8",
      accentSoft: "#DCE8F7",
      rule: "#C8703F",
      onAccent: "#FFFFFF",
    },
  },
  "marble-gilt": {
    id: "marble-gilt",
    dark: false,
    fonts: "deco",
    ornament: "deco",
    surface: "marble",
    motion: "veil",
    palette: {
      bg: "#F6F4F1",
      surface: "#FFFFFF",
      ink: "#23201C",
      muted: "#776F65",
      accent: "#9A7B3F",
      accentSoft: "#EBE4D8",
      rule: "#C9B27E",
      onAccent: "#FFFDF8",
    },
  },
  rosewater: {
    id: "rosewater",
    dark: false,
    fonts: "modern",
    ornament: "leaf",
    surface: "grain",
    motion: "fade-rise",
    palette: {
      bg: "#FDF7F6",
      surface: "#FFFFFF",
      ink: "#3B2A2C",
      muted: "#8A6F72",
      accent: "#B4737C",
      accentSoft: "#F5E2E3",
      rule: "#DFBFC2",
      onAccent: "#FFFFFF",
    },
  },
  "sand-terracotta": {
    id: "sand-terracotta",
    dark: false,
    fonts: "modern",
    ornament: "weave",
    surface: "linen",
    motion: "fade-rise",
    palette: {
      bg: "#FAF6F0",
      surface: "#FFFFFF",
      ink: "#33281F",
      muted: "#7E6B58",
      accent: "#B45B3E",
      accentSoft: "#F3E1D6",
      rule: "#D8B79B",
      onAccent: "#FFF8F3",
    },
  },
  /**
   * The one theme with no ornament and no colour. Built for studios that
   * photograph in black and white and sell on restraint: the accent is ink
   * rather than a metal, so nothing on the page competes with the photograph.
   */
  "atelier-blanc": {
    id: "atelier-blanc",
    dark: false,
    fonts: "editorial",
    ornament: "none",
    surface: "plaster",
    motion: "fade-rise",
    lettering: "tracked-caps",
    chrome: "open",
    palette: {
      bg: "#F1EEE9",
      surface: "#FAF8F5",
      ink: "#141312",
      muted: "#8A857D",
      accent: "#1B1917",
      accentSoft: "#E4E0D9",
      rule: "#CBC6BC",
      onAccent: "#F7F5F1",
    },
  },
  kasavu: {
    id: "kasavu",
    dark: false,
    fonts: "garamond",
    ornament: "weave",
    surface: "linen",
    motion: "veil",
    palette: {
      bg: "#FCFAF4",
      surface: "#FFFFFF",
      ink: "#2B2A25",
      muted: "#7A7566",
      accent: "#C0A248",
      accentSoft: "#F2EBD6",
      rule: "#C9B36B",
      onAccent: "#FFFFFF",
    },
  },
};

export const THEME_LIST: Theme[] = Object.values(THEMES);

export function themeVars(theme: Theme): Record<string, string> {
  const stack = FONT_STACKS[theme.fonts];
  const set = LETTERING[theme.lettering ?? "titlecase"];
  return {
    "--bg": theme.palette.bg,
    "--surface": theme.palette.surface,
    "--ink": theme.palette.ink,
    "--muted": theme.palette.muted,
    "--accent": theme.palette.accent,
    "--accent-soft": theme.palette.accentSoft,
    "--rule": theme.palette.rule,
    "--on-accent": theme.palette.onAccent,
    "--f-display": stack.display,
    "--f-body": stack.body,
    "--display-case": set.case,
    "--display-track": set.track,
    "--amp-style": set.amp,
    "--gilt-fill": set.giltFill,
  };
}
