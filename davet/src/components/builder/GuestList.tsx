"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text } from "./Fields";
import { guestToken, guestLink } from "@/lib/guestToken";
import type { Messages } from "@/lib/i18n";
import type { Guest } from "@/lib/types";

/**
 * The guest list is what turns "someone opened the link" into a number the
 * kitchen can cook against: every household has its own link and a seat
 * allowance, and the RSVP form will not accept more people than that.
 */
export function GuestList({
  inviteId, slug, siteUrl, initial, repliedIds, m,
}: {
  inviteId: string;
  slug: string;
  siteUrl: string;
  initial: Guest[];
  /** Households that have already answered; shown, never editable here. */
  repliedIds: string[];
  m: Messages;
}) {
  const [guests, setGuests] = useState<Guest[]>(initial);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  const replied = useMemo(() => new Set(repliedIds), [repliedIds]);

  /** Autosaved like the rest of the builder: no Save button to forget. */
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch("/api/guests", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ inviteId, guests }),
        });
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [guests, inviteId]);

  const patch = useCallback((id: string, next: Partial<Guest>) => {
    setGuests((p) => p.map((g) => (g.id === id ? { ...g, ...next } : g)));
  }, []);

  const add = () => setGuests((p) => [
    ...p,
    {
      id: crypto.randomUUID(), inviteId, token: guestToken(),
      household: "", seats: 2, email: "", phone: "", sort: p.length,
    },
  ]);

  /** "Familie Yilmaz, 4, mail@x.de, +49…" — one household per line. */
  function importCsv(text: string) {
    const rows = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed = rows.map((line, i) => {
      const [household = "", seats = "2", email = "", phone = ""] =
        line.split(",").map((c) => c.trim());
      return {
        id: crypto.randomUUID(), inviteId, token: guestToken(),
        household,
        seats: Math.min(20, Math.max(1, Number(seats) || 2)),
        email, phone, sort: i,
      };
    });
    setGuests((p) => [...p, ...parsed].map((g, i) => ({ ...g, sort: i })));
  }

  const totalSeats = guests.reduce((s, g) => s + g.seats, 0);

  return (
    <div>
      <p className="note">{m.guests.lede}</p>

      <p className="guest-total">
        <strong>{totalSeats}</strong> {m.guests.total} ·{" "}
        {replied.size} {m.guests.replied} ·{" "}
        {guests.length - replied.size} {m.guests.open}
        {saving && <span className="note"> · {m.b.saving}…</span>}
      </p>

      {guests.length === 0 && <p className="b-missing">{m.guests.empty}</p>}

      {guests.map((g) => (
        <div className="b-item" key={g.id}>
          <div className="guest-fields">
            <Text label={m.guests.household} value={g.household}
                  onChange={(v) => patch(g.id, { household: v })} />
            <Text label={m.guests.seats} type="number" inputMode="numeric"
                  value={String(g.seats)}
                  onChange={(v) => patch(g.id, {
                    seats: Math.min(20, Math.max(1, Number(v) || 1)),
                  })} />
            <Text label={m.guests.email} value={g.email} inputMode="email"
                  onChange={(v) => patch(g.id, { email: v })} />
            <Text label={m.guests.phone} value={g.phone} inputMode="tel"
                  onChange={(v) => patch(g.id, { phone: v })} />
          </div>

          <div className="row" style={{ marginTop: ".5rem" }}>
            <button type="button" className="b-linkbtn"
                    onClick={() => {
                      navigator.clipboard?.writeText(guestLink(siteUrl, slug, g.token))
                        .then(() => {
                          setCopied(g.id);
                          setTimeout(() => setCopied(null), 1500);
                        })
                        .catch(() => {});
                    }}>
              {copied === g.id ? m.guests.copied : m.guests.copyLink}
            </button>
            {replied.has(g.id) && <span className="pill">{m.guests.replied}</span>}
          </div>

          <button type="button" className="b-remove"
                  onClick={() => setGuests((p) =>
                    p.filter((x) => x.id !== g.id).map((x, i) => ({ ...x, sort: i })))}>
            {m.guests.remove}
          </button>
        </div>
      ))}

      <div className="row" style={{ marginTop: "1rem" }}>
        <button type="button" className="b-add" onClick={add}>+ {m.guests.add}</button>
        <label className="b-linkbtn" style={{ cursor: "pointer" }}>
          {m.guests.importCsv}
          <input
            type="file" accept=".csv,text/csv,text/plain" hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              importCsv(await file.text());
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="note" style={{ marginTop: ".4rem" }}>{m.guests.importHint}</p>
    </div>
  );
}
