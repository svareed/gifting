"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/types";

/**
 * An iOS-style date wheel. `<input type="date">` gives iOS this for free and
 * every other platform something different, so the one control that sets an
 * RSVP deadline behaves the same everywhere it is opened.
 *
 * The value is a plain calendar date, "YYYY-MM-DD" — no instant, no zone. A
 * deadline is a day on a wall calendar, not a moment, which is also why this
 * never goes near lib/datetime: there is nothing to convert.
 */

/** Row height in px. Mirrored by .wheel-item in globals.css. */
const ITEM = 36;
/** Blank rows above and below, so the first and last row can reach the band. */
const PAD_ROWS = 2;

type Parts = { y: number; m: number; d: number };

function parse(value: string | null, fallback: Date): Parts {
  const hit = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (hit) return { y: +hit[1], m: +hit[2], d: +hit[3] };
  return { y: fallback.getFullYear(), m: fallback.getMonth() + 1, d: fallback.getDate() };
}

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (p: Parts) => `${p.y}-${pad(p.m)}-${pad(p.d)}`;
/** Day 0 of the next month is the last day of this one. */
const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();

const INTL: Record<Locale, string> = { de: "de-DE", tr: "tr-TR", en: "en-GB" };

/** One scroll-snapping column. Reports whichever row settles under the band. */
function Wheel({
  options, index, onIndex, label,
}: {
  options: { value: number; label: string }[];
  index: number;
  onIndex: (i: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Silences the scroll handler while we are the ones doing the scrolling. */
  const programmatic = useRef(false);

  /**
   * The scroll offset that centres row `i`, measured from the DOM rather than
   * computed from ITEM and PAD_ROWS. Deriving it kept one column landing a row
   * off its neighbours whenever a rounding or padding assumption drifted; asking
   * the element where the row actually is cannot drift.
   */
  const offsetFor = (el: HTMLDivElement, i: number): number | null => {
    // children[0] is the top spacer, so rows start at 1.
    const row = el.children[i + 1] as HTMLElement | undefined;
    if (!row) return null;
    return row.offsetTop - (el.clientHeight - row.offsetHeight) / 2;
  };

  // Layout effect: the column mounts with the sheet, and a scroll still
  // settling gets re-snapped by `scroll-snap-type: mandatory`. Assert the
  // position again after layout to win that race.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = offsetFor(el, index);
    if (target === null || Math.abs(el.scrollTop - target) < 1) return;
    programmatic.current = true;
    el.scrollTop = target;
    requestAnimationFrame(() => {
      const again = offsetFor(el, index);
      if (again !== null && Math.abs(el.scrollTop - again) >= 1) el.scrollTop = again;
      requestAnimationFrame(() => { programmatic.current = false; });
    });
  }, [index, options.length]);

  const onScroll = useCallback(() => {
    if (programmatic.current) return;
    if (settle.current) clearTimeout(settle.current);
    // Momentum scrolling fires continuously; only the resting place matters.
    settle.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      // Whichever row is nearest the band wins — same basis as offsetFor, so
      // reading back a position always agrees with writing one.
      let best = 0;
      let bestGap = Infinity;
      for (let i = 0; i < options.length; i++) {
        const at = offsetFor(el, i);
        if (at === null) continue;
        const gap = Math.abs(at - el.scrollTop);
        if (gap < bestGap) { bestGap = gap; best = i; }
      }
      onIndex(best);
    }, 90);
  }, [onIndex, options.length]);

  useEffect(() => () => { if (settle.current) clearTimeout(settle.current); }, []);

  return (
    <div
      className="wheel"
      ref={ref}
      onScroll={onScroll}
      tabIndex={0}
      role="listbox"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        e.preventDefault();
        const step = e.key === "ArrowDown" ? 1 : -1;
        onIndex(Math.min(options.length - 1, Math.max(0, index + step)));
      }}
    >
      <div style={{ height: PAD_ROWS * ITEM }} aria-hidden="true" />
      {options.map((o, i) => (
        <div
          key={o.value}
          role="option"
          aria-selected={i === index}
          className={`wheel-item ${i === index ? "is-on" : ""}`}
        >
          {o.label}
        </div>
      ))}
      <div style={{ height: PAD_ROWS * ITEM }} aria-hidden="true" />
    </div>
  );
}

export function WheelDate({
  label, value, onChange, locale, t,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  /** Month names and the summary line follow the interface language. */
  locale: Locale;
  t: { done: string; cancel: string; clear: string; noDate: string; pickDate: string };
}) {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  const [draft, setDraft] = useState<Parts>(() => parse(value, today));

  // Opening always starts from what is saved, so Cancel really does cancel.
  useEffect(() => { if (open) setDraft(parse(value, today)); }, [open, value, today]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const intl = INTL[locale];
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) =>
      new Intl.DateTimeFormat(intl, { month: "long" }).format(new Date(2020, i, 1))),
    [intl],
  );
  // Starts at whichever is earlier, this year or the year already saved, so a
  // deadline set last season is still selectable rather than silently moved.
  const years = useMemo(() => {
    const first = Math.min(today.getFullYear(), draft.y);
    const span = Math.max(8, today.getFullYear() + 8 - first);
    return Array.from({ length: span }, (_, i) => first + i);
  }, [today, draft.y]);

  // 31 January → February must not leave the day out of range.
  const day = Math.min(draft.d, daysIn(draft.y, draft.m));

  const dayOpts = Array.from({ length: daysIn(draft.y, draft.m) },
    (_, i) => ({ value: i + 1, label: String(i + 1) }));
  const monthOpts = months.map((name, i) => ({ value: i + 1, label: name }));
  const yearOpts = years.map((y) => ({ value: y, label: String(y) }));

  const shown = value
    ? new Intl.DateTimeFormat(intl, { day: "2-digit", month: "long", year: "numeric" })
        // Midday UTC: no zone can push a bare date onto the neighbouring day.
        .format(new Date(`${value}T12:00:00Z`))
    : t.noDate;

  return (
    <div className="field">
      <span className="label">{label}</span>
      <button type="button" className="datebtn" onClick={() => setOpen(true)}>
        <span className={value ? "" : "is-empty"}>{shown}</span>
        <span className="datebtn-hint" aria-hidden="true">{t.pickDate}</span>
      </button>

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={label}
               onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <button type="button" className="sheet-act" onClick={() => setOpen(false)}>
                {t.cancel}
              </button>
              <span className="sheet-title">{label}</span>
              <button type="button" className="sheet-act is-primary"
                      onClick={() => { onChange(toIso({ ...draft, d: day })); setOpen(false); }}>
                {t.done}
              </button>
            </div>

            <div className="wheels">
              <div className="wheel-band" aria-hidden="true" />
              <Wheel label={label} options={dayOpts} index={day - 1}
                     onIndex={(i) => setDraft((p) => ({ ...p, d: dayOpts[i].value }))} />
              <Wheel label={label} options={monthOpts} index={draft.m - 1}
                     onIndex={(i) => setDraft((p) => ({ ...p, m: monthOpts[i].value }))} />
              <Wheel label={label} options={yearOpts}
                     index={Math.max(0, years.indexOf(draft.y))}
                     onIndex={(i) => setDraft((p) => ({ ...p, y: yearOpts[i].value }))} />
            </div>

            <button type="button" className="sheet-clear"
                    onClick={() => { onChange(null); setOpen(false); }}>
              {t.clear}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
