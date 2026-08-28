import { describe, expect, it } from "vitest";
import { isFamilyNameLinked, setPartnerName } from "../src/lib/linked";
import { seedInvite } from "../src/lib/seed";

const base = () => seedInvite({ id: "t", ownerId: "o", locale: "en" });

describe("names flow from the couple section into the families", () => {
  it("updates the matching family block as the couple name is typed", () => {
    const next = setPartnerName(base(), "a", "Jonas");
    expect(next.partnerAName).toBe("Jonas");
    expect(next.families.find((f) => f.side === "a")!.personName).toBe("Jonas");
  });

  it("leaves the other side alone", () => {
    const before = base();
    const next = setPartnerName(before, "a", "Jonas");
    expect(next.families.find((f) => f.side === "b")!.personName)
      .toBe(before.families.find((f) => f.side === "b")!.personName);
  });

  it("fills a family block that was left empty", () => {
    const start = base();
    start.families = start.families.map((f) =>
      f.side === "a" ? { ...f, personName: "" } : f,
    );
    expect(setPartnerName(start, "a", "Jonas").families[0].personName).toBe("Jonas");
  });

  it("stops following once the family name is edited by hand", () => {
    let inv = base();
    inv = setPartnerName(inv, "a", "Jonas");
    // The couple types a fuller name in the family block.
    inv = { ...inv, families: inv.families.map((f) =>
      f.side === "a" ? { ...f, personName: "Jonas Müller" } : f) };
    expect(isFamilyNameLinked(inv, inv.families[0].id)).toBe(false);

    inv = setPartnerName(inv, "a", "Jo");
    expect(inv.partnerAName).toBe("Jo");
    expect(inv.families.find((f) => f.side === "a")!.personName).toBe("Jonas Müller");
  });

  it("keeps following across several edits while they agree", () => {
    let inv = base();
    for (const n of ["J", "Jo", "Jon", "Jonas"]) inv = setPartnerName(inv, "a", n);
    expect(inv.families.find((f) => f.side === "a")!.personName).toBe("Jonas");
    expect(isFamilyNameLinked(inv, inv.families[0].id)).toBe(true);
  });
});
