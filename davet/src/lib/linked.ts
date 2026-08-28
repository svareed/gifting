import type { Invite } from "./types";

/**
 * Fields entered early flow downstream until someone overrides them.
 *
 * A family's person name follows the matching couple field for as long as the
 * two agree. The moment someone types something different there — a full name,
 * a different spelling — the link is broken and the couple field stops
 * reaching it. No extra state is stored: agreement *is* the link.
 */
export function setPartnerName(
  invite: Invite,
  side: "a" | "b",
  value: string,
): Invite {
  const previous = side === "a" ? invite.partnerAName : invite.partnerBName;

  const families = invite.families.map((f) => {
    if (f.side !== side) return f;
    const following = !f.personName.trim() || f.personName.trim() === previous.trim();
    return following ? { ...f, personName: value } : f;
  });

  return side === "a"
    ? { ...invite, partnerAName: value, families }
    : { ...invite, partnerBName: value, families };
}

/** True while this family's name is still mirroring the couple field. */
export function isFamilyNameLinked(invite: Invite, familyId: string): boolean {
  const f = invite.families.find((x) => x.id === familyId);
  if (!f) return false;
  const source = f.side === "a" ? invite.partnerAName : invite.partnerBName;
  return !f.personName.trim() || f.personName.trim() === source.trim();
}
