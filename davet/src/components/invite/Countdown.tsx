"use client";
import { useEffect, useState } from "react";
import { countdown } from "@/lib/datetime";
import type { Messages } from "@/lib/i18n";

/**
 * Counts to one absolute UTC instant, so Berlin and Kochi agree. Renders
 * zeroes on the server and fills in after mount to avoid a hydration mismatch.
 */
export function Countdown({ targetIso, m }: { targetIso: string; m: Messages }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let parts = { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };
  if (now !== null) {
    try {
      parts = countdown(targetIso, now);
    } catch {
      return null;
    }
  }

  const cells = [
    [parts.days, m.countdown.days],
    [parts.hours, m.countdown.hours],
    [parts.minutes, m.countdown.minutes],
    [parts.seconds, m.countdown.seconds],
  ] as const;

  return (
    <div className="countdown" role="timer" aria-live="off">
      {cells.map(([value, label]) => (
        <div className="cd-cell" key={label}>
          <div className="cd-num">{String(value).padStart(2, "0")}</div>
          <div className="cd-lbl">{label}</div>
        </div>
      ))}
    </div>
  );
}
