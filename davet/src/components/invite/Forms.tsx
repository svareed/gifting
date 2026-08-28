"use client";
import { useEffect, useState } from "react";
import type { Messages } from "@/lib/i18n";

type Common = { inviteId: string; m: Messages; live: boolean };

/** A hidden field real people never fill in and simple bots always do. */
function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
      <label>
        Company
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export function RsvpForm({
  inviteId, m, live, deadlineLabel, household,
}: Common & {
  deadlineLabel: string | null;
  /**
   * Present when the guest arrived through their household's own link. The
   * seat allowance is the ceiling the form offers, so a headcount can never
   * come back larger than what was actually invited.
   */
  household: { token: string; name: string; seats: number } | null;
}) {
  const [name, setName] = useState(household?.name ?? "");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guests, setGuests] = useState(household ? household.seats : 1);
  const [message, setMessage] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  if (state === "done") {
    return <div className="card center"><p>{m.rsvp.thanks}</p></div>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!live || attending === null || !name.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          inviteId, name, attending,
          guestCount: attending ? guests : 0,
          message, trap,
          guestToken: household?.token ?? null,
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <form className="card" onSubmit={submit} style={{ position: "relative" }}>
      <Honeypot value={trap} onChange={setTrap} />
      {deadlineLabel && <p className="note center" style={{ marginBottom: "1rem" }}>{m.rsvp.respondBy} {deadlineLabel}</p>}

      <label className="field">
        <span className="label">{m.rsvp.yourName}</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <div className="field">
        <span className="label">{m.rsvp.heading}</span>
        <div className="choice">
          <button type="button" aria-pressed={attending === true} onClick={() => setAttending(true)}>
            {m.rsvp.attending}
          </button>
          <button type="button" aria-pressed={attending === false} onClick={() => setAttending(false)}>
            {m.rsvp.notAttending}
          </button>
        </div>
      </div>

      {attending === true && (
        <label className="field">
          <span className="label">{m.rsvp.guests}</span>
          <input className="input" type="number" min={1}
                 max={household ? household.seats : 20} value={guests}
                 onChange={(e) => setGuests(
                   Math.min(household ? household.seats : 20,
                            Math.max(1, Number(e.target.value) || 1)),
                 )} />
          {household && (
            <span className="note">{m.rsvp.seatsHint.replace("{n}", String(household.seats))}</span>
          )}
        </label>
      )}

      <label className="field">
        <span className="label">{m.rsvp.message}</span>
        <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>

      <button className="btn" style={{ width: "100%" }} disabled={!live || state === "sending" || attending === null}>
        {state === "sending" ? m.rsvp.sending : m.rsvp.send}
      </button>

      {state === "error" && <p className="note center" style={{ marginTop: ".75rem" }}>{m.rsvp.failed}</p>}
      <p className="note" style={{ marginTop: ".9rem" }}>{m.rsvp.privacy}</p>
    </form>
  );
}


export function MusicToggle({ m }: { m: Messages }) {
  const [playing, setPlaying] = useState(false);
  // Audio may not autoplay: playback starts from this click and nowhere else.
  return (
    <button
      className="music-btn"
      aria-label={playing ? m.music.pause : m.music.play}
      onClick={(e) => {
        const btn = e.currentTarget;
        const audio = btn.querySelector("audio") as HTMLAudioElement | null;
        if (!audio) return;
        if (playing) { audio.pause(); setPlaying(false); }
        else { audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
      }}
    >
      {playing ? "❚❚" : "♪"}
      <audio loop preload="none" src="/music/ambient.mp3" />
    </button>
  );
}
