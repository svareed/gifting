/**
 * The placeholder venue used wherever the product needs an example brand — the
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
