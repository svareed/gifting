/** Product name lives here alone. Renaming Davet is a one-line edit. */
export const PRODUCT_NAME = "Davet";

/**
 * Share links and OG image URLs need an absolute origin, but the deployment URL
 * is not known until Vercel has built the project once. Prefer the stable
 * production domain over VERCEL_URL, which changes with every deployment and
 * would put preview URLs into invitations sent to guests.
 */
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

/**
 * Who operates the service. German law requires this on every page that is
 * publicly reachable, an invitation included, and a missing Impressum is
 * not a rough edge but an abmahnfähig offence under §5 DDG. Kept in the
 * environment so a self-hoster fills it in once rather than editing code.
 *
 * The defaults are deliberately obvious placeholders: shipping a blank
 * Impressum silently is worse than shipping one that says it is unfinished.
 */
export const OPERATOR = {
  name: process.env.NEXT_PUBLIC_OPERATOR_NAME ?? "[Betreibername eintragen]",
  street: process.env.NEXT_PUBLIC_OPERATOR_STREET ?? "[Straße und Hausnummer]",
  city: process.env.NEXT_PUBLIC_OPERATOR_CITY ?? "[PLZ und Ort]",
  country: process.env.NEXT_PUBLIC_OPERATOR_COUNTRY ?? "Deutschland",
  represented: process.env.NEXT_PUBLIC_OPERATOR_REPRESENTED ?? "[Vertretungsberechtigte Person]",
  email: process.env.NEXT_PUBLIC_OPERATOR_EMAIL ?? "[kontakt@example.de]",
  phone: process.env.NEXT_PUBLIC_OPERATOR_PHONE ?? "[Telefonnummer]",
  vatId: process.env.NEXT_PUBLIC_OPERATOR_VAT_ID ?? "[USt-IdNr., falls vorhanden]",
  /** Where the database and backups actually live. Asked in every German sale. */
  hostingRegion: process.env.NEXT_PUBLIC_HOSTING_REGION ?? "Frankfurt am Main, Deutschland (EU)",
} as const;

/** True while any operator detail is still a placeholder. */
export const OPERATOR_INCOMPLETE = Object.values(OPERATOR).some((v) =>
  v.startsWith("["),
);
