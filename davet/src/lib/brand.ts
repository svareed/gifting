/**
 * The placeholder venue used wherever the product needs an example brand, the
 * seeded invitation, a new organisation's name, screenshots. Deliberately a
 * plausible-but-invented German hall rather than a real business: seed data
 * that carries a real company's name is impersonation the moment anyone
 * publishes it.
 *
 * "Rosenhof" is about as ordinary as German venue names get, which is the
 * point: it should read as familiar and belong to nobody.
 */
export const EXAMPLE_VENUE = {
  name: "Festsaal Rosenhof",
  /** Subdomain label, and the CSV/print file prefix. */
  slug: "rosenhof",
  website: "https://www.festsaal-rosenhof.de",
  phone: "+49 211 5550142",
  /** Initials for the wordmark, so no image asset has to ship. */
  monogram: "FR",
} as const;

/**
 * The placeholder studio, for the same reason and under the same rule: a
 * plausible-but-invented German name that belongs to nobody. Photographers and
 * planners are the other half of this product's buyers, they resell the
 * invitation with the shoot, and a hall's example does not show them
 * anything, so they get their own.
 */
export const EXAMPLE_STUDIO = {
  name: "Atelier Nordlicht",
  /** Subdomain label: nordlicht.davet.de. */
  slug: "nordlicht",
  website: "https://www.atelier-nordlicht.de",
  phone: "+49 40 5550188",
  monogram: "AN",
} as const;
