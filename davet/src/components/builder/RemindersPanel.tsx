"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n";

export type DueRow = {
  guestId: string;
  household: string;
  kind: "t14" | "t7";
  phone: string;
  email: string;
  text: string;
  whatsapp: string | null;
};

/**
 * WhatsApp has no server-side send without the Business API, and a venue with
 * sixty weddings a year is not going to apply for one. Click-to-send is what
 * they already do by hand — this just writes the message and keeps the score.
 */
export function RemindersPanel({ rows, m }: { rows: DueRow[]; m: Messages }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function mark(guestId: string, kind: "t14" | "t7", channel: "email" | "whatsapp") {
    setBusy(guestId + kind);
    try {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guestId, kind, channel }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) return <p className="note">{m.reminders.none}</p>;

  return (
    <div className="list" style={{ marginTop: "1rem" }}>
      {rows.map((r) => (
        <div className="list-row" key={r.guestId + r.kind}>
          <div style={{ minWidth: 0 }}>
            <strong>{r.household}</strong>
            <div className="note">{r.kind === "t14" ? "14" : "7"} · {m.reminders.due}</div>
            <p className="reminder-text">{r.text}</p>
          </div>
          <div className="row">
            {r.whatsapp && (
              <a className="cta cta-ghost" href={r.whatsapp}
                 target="_blank" rel="noopener noreferrer"
                 onClick={() => mark(r.guestId, r.kind, "whatsapp")}>
                {m.reminders.sendWhatsapp}
              </a>
            )}
            <button type="button" className="cta cta-ghost"
                    disabled={busy === r.guestId + r.kind}
                    onClick={() => mark(r.guestId, r.kind, "whatsapp")}>
              {m.reminders.markSent}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
