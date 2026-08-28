import { store } from "./db";
import { EXAMPLE_VENUE } from "./brand";
import type { Organization } from "./types";

/**
 * The organisation the signed-in person belongs to, created on first use.
 * Nobody should have to complete a setup wizard before seeing the product
 * work, so a new account gets a placeholder venue it can rename later.
 */
export async function orgFor(ownerId: string): Promise<Organization> {
  return (await store()).ensureOrg(ownerId, {
    name: EXAMPLE_VENUE.name,
    slug: EXAMPLE_VENUE.slug,
  });
}

/** The host an org's subdomain hangs off: "davet.de" in "rosenhof.davet.de". */
export function hostSuffix(siteUrl: string): string {
  try {
    return new URL(siteUrl).host;
  } catch {
    return "davet.de";
  }
}
