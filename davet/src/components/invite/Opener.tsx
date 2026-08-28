"use client";
import { useEffect, useRef, useState } from "react";
import type { Messages } from "@/lib/i18n";
import type { OpenerId } from "@/lib/types";
import type { Theme } from "@/lib/themes";
import { Ornament } from "./Ornament";

type Props = {
  opener: OpenerId;
  theme: Theme;
  names: { a: string; b: string };
  /** Revealed under the foil, and printed inside the envelope. */
  dateLabel?: string;
  m: Messages;
  onOpen: () => void;
};

export function Opener(props: Props) {
  switch (props.opener) {
    case "veil": return <Veil {...props} />;
    case "foil": return <Foil {...props} />;
    case "envelope": return <Envelope {...props} />;
    default: return null;
  }
}

function Names({ a, b }: { a: string; b: string }) {
  return (
    <h1 className="cover-names display">
      {a}
      <span className="cover-amp">&amp;</span>
      {b}
    </h1>
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* -------------------------------------------------------------- veil ---- */

function Veil({ names, m, theme, onOpen }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) { setProgress(100); return; }
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 100 : p + 4)), 28);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="cover">
      <div>
        <Ornament id={theme.ornament} size={30} />
        <Names {...names} />
        <div className="rule" aria-hidden="true"><Ornament id={theme.ornament} /></div>
        {progress < 100 ? (
          <p className="eyebrow">{m.opener.preparing} {progress}%</p>
        ) : (
          <button className="btn" onClick={onOpen}>{m.opener.open}</button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- foil ---- */

/** Gold leaf, deliberately independent of the theme palette: a scratch panel
 *  reads as foil only if it actually looks metallic. */
const GOLD = [
  [0.00, "#8A6714"],
  [0.14, "#C9A227"],
  [0.28, "#F6E7A9"],
  [0.42, "#D4AF37"],
  [0.58, "#FFF6D0"],
  [0.72, "#C08F1E"],
  [0.86, "#EBD37C"],
  [1.00, "#9A7419"],
] as const;

function paintFoil(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  for (const [stop, colour] of GOLD) grad.addColorStop(stop, colour);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Brushed sheen, so the surface catches light rather than reading as flat.
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#FFFDF0";
  ctx.lineWidth = 1;
  for (let x = -h; x < w + h; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h, h);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = "#4A3708";
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
  ctx.restore();
}

function Foil({ names, dateLabel, m, theme, onOpen }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cleared, setCleared] = useState(false);
  const clearedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      // Container-query sizing means the box may still be settling on first
      // paint; bail and let the ResizeObserver call back.
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      paintFoil(ctx, width, height);
      ctx.globalCompositeOperation = "destination-out";
      return true;
    };

    let ready = setup();

    const ro = new ResizeObserver(() => {
      // Never repaint over someone's progress; only size an unpainted panel.
      if (!ready && !clearedRef.current) ready = setup();
    });
    ro.observe(canvas);

    const scratchedFraction = () => {
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let clear = 0;
      let total = 0;
      for (let i = 3; i < data.length; i += 4 * 32) {
        total++;
        if (data[i] < 24) clear++;
      }
      return total ? clear / total : 0;
    };

    const finish = () => {
      if (clearedRef.current) return;
      clearedRef.current = true;
      setCleared(true);
    };

    let drawing = false;
    let last: { x: number; y: number } | null = null;

    const point = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const eraseTo = (p: { x: number; y: number }) => {
      const radius = Math.max(16, Math.min(width, height) * 0.11);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = radius * 2;
      ctx.beginPath();
      // Stroke from the previous point so a fast drag leaves no gaps.
      ctx.moveTo(last ? last.x : p.x, last ? last.y : p.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      last = p;
    };

    const down = (e: PointerEvent) => {
      if (!ready) ready = setup();
      e.preventDefault();
      drawing = true;
      last = null;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* not fatal */ }
      eraseTo(point(e));
    };

    const move = (e: PointerEvent) => {
      if (!drawing) return;
      e.preventDefault();
      eraseTo(point(e));
      // Checked continuously, so a slow steady scratch still completes.
      if (scratchedFraction() > 0.4) finish();
    };

    const up = () => {
      drawing = false;
      last = null;
      if (scratchedFraction() > 0.28) finish();
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", up);

    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("pointerleave", up);
    };
  }, []);

  return (
    <div className="cover">
      <div>
        <Names {...names} />

        <div className="foil-wrap" style={{ marginTop: "1.5rem" }}>
          <div className="foil-under">
            <Ornament id={theme.ornament} size={26} />
            {dateLabel && <p className="foil-date display">{dateLabel}</p>}
          </div>
          <canvas
            ref={canvasRef}
            className={`foil-canvas ${cleared ? "is-cleared" : ""}`}
            aria-hidden="true"
          />
        </div>

        <p className="eyebrow" style={{ marginTop: "1.25rem" }}>
          {cleared ? m.opener.revealed : m.opener.scratch}
        </p>

        {/* Always present: a scratch panel is unusable with a keyboard or a
            screen reader, so the invitation must be reachable without it. */}
        <button
          className={cleared ? "btn" : "btn btn-ghost"}
          style={{ marginTop: "1rem" }}
          onClick={onOpen}
        >
          {m.opener.open}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- envelope ---- */

function Envelope({ names, dateLabel, m, theme, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /** One tap opens the flap and carries straight on into the invitation. */
  const openAndContinue = () => {
    if (open) return;
    setOpen(true);
    const wait = prefersReducedMotion() ? 0 : 720;
    timer.current = setTimeout(onOpen, wait);
  };

  return (
    <div className="cover">
      <div>
        <Names {...names} />
        <button
          type="button"
          className="env"
          data-open={open}
          aria-label={m.opener.tapToOpen}
          style={{ marginTop: "1.75rem" }}
          onClick={openAndContinue}
        >
          <span className="env-flap" aria-hidden="true" />
          <span className="env-card" aria-hidden="true">
            {dateLabel && <span className="env-date display">{dateLabel}</span>}
          </span>
          <span className="env-seal" aria-hidden="true">
            <Ornament id={theme.ornament} size={18} />
          </span>
        </button>
        <p className="eyebrow" style={{ marginTop: "1.25rem" }}>{m.opener.tapToOpen}</p>
      </div>
    </div>
  );
}
