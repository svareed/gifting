/**
 * Household link tokens. Short enough to read aloud over the phone, long
 * enough that guessing another household's link is not worth trying — these
 * only ever reveal one household's name and seat count, never the list.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function guestToken(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** The link a household is actually sent. */
export function guestLink(siteUrl: string, slug: string, token: string): string {
  return `${siteUrl}/${slug}?g=${token}`;
}
