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
