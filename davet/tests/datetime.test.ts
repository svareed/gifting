import { describe, expect, it } from "vitest";
import {
  countdown, formatEventDate, formatShortDate,
  parseUtcIso, utcIsoToWallTime, wallTimeToUtcIso,
} from "../src/lib/datetime";

describe("Safari-safe parsing", () => {
  it("rejects the space-separated form Safari cannot parse", () => {
    // new Date("2026-08-27 12:00") is Invalid Date in Safari, valid in Chrome.
    expect(() => parseUtcIso("2026-08-27 12:00")).toThrow();
    expect(() => parseUtcIso("2026-08-27T12:00")).toThrow();
    expect(parseUtcIso("2026-08-27T12:00:00.000Z").getTime()).toBeGreaterThan(0);
  });
});

describe("wall time to UTC", () => {
  it("applies summer offset in Berlin", () => {
    expect(wallTimeToUtcIso("2026-06-12T12:00", "Europe/Berlin"))
      .toBe("2026-06-12T10:00:00.000Z");
  });

  it("applies winter offset in Berlin", () => {
    expect(wallTimeToUtcIso("2026-01-12T12:00", "Europe/Berlin"))
      .toBe("2026-01-12T11:00:00.000Z");
  });

  it("handles Istanbul's fixed +03", () => {
    expect(wallTimeToUtcIso("2026-06-12T12:00", "Europe/Istanbul"))
      .toBe("2026-06-12T09:00:00.000Z");
  });

  it("handles a half-hour offset", () => {
    expect(wallTimeToUtcIso("2026-06-12T12:00", "Asia/Kolkata"))
      .toBe("2026-06-12T06:30:00.000Z");
  });

  it("round-trips through the form value", () => {
    for (const tz of ["Europe/Berlin", "Asia/Kolkata", "America/New_York"]) {
      const iso = wallTimeToUtcIso("2026-06-12T18:45", tz);
      expect(utcIsoToWallTime(iso, tz)).toBe("2026-06-12T18:45");
    }
  });

  it("survives the spring-forward boundary", () => {
    const iso = wallTimeToUtcIso("2026-03-29T04:00", "Europe/Berlin");
    expect(utcIsoToWallTime(iso, "Europe/Berlin")).toBe("2026-03-29T04:00");
  });
});

describe("countdown", () => {
  const target = "2026-06-12T10:00:00.000Z";

  it("is identical for guests in different zones", () => {
    // One absolute instant: the viewer's own zone cannot change the answer.
    const now = Date.parse("2026-06-10T10:00:00.000Z");
    expect(countdown(target, now)).toEqual({
      days: 2, hours: 0, minutes: 0, seconds: 0, done: false,
    });
  });

  it("reports done once the instant passes", () => {
    expect(countdown(target, Date.parse("2026-06-12T10:00:01.000Z")).done).toBe(true);
  });
});

describe("locale formatting", () => {
  const iso = "2026-06-12T10:00:00.000Z";

  it("renders each locale in its own conventions", () => {
    expect(formatEventDate(iso, "de", "Europe/Berlin")).toContain("Juni");
    expect(formatEventDate(iso, "tr", "Europe/Istanbul")).toContain("Haziran");
    expect(formatEventDate(iso, "en", "Europe/London")).toContain("June");
  });

  it("keeps day-month order in short dates", () => {
    expect(formatShortDate(iso, "en", "Europe/London")).toBe("12/06/2026");
  });
});
