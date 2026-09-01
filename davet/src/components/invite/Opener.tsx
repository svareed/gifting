"use client";
import { useEffect, useRef, useState } from "react";
import type { Messages } from "@/lib/i18n";
import type { OpenerId } from "@/lib/types";
import type { Theme } from "@/lib/themes";
import { Ornament, Rule } from "./Ornament";

type Props = {
  opener: OpenerId;
  theme: Theme;
  names: { a: string; b: string };
  /** Revealed under the foil, and printed inside the envelope. */
  dateLabel?: string;
  /** The cover photograph. Only "tor" uses it, and only if there is one. */
  heroImage?: string | null;
  /** An optional pre-rendered opening. See the film branch in Tor. */
  film?: string | null;
  /** The film's own first frame. Must match it exactly, or the join shows. */
  filmPoster?: string | null;
  /** The portrait cut, and its own first frame. Used on screens taller than
   *  they are wide; without it those screens letterbox the landscape one. */
  filmMobile?: string | null;
  filmMobilePoster?: string | null;
  /** The supplier's wordmark, when the invitation shows one. */
  mark?: string;
  m: Messages;
  onOpen: () => void;
};

export function Opener(props: Props) {
  switch (props.opener) {
    case "tor":
      // Nothing to open onto without a photograph, so fall back rather than
      // parting two leaves over an empty plaster wall.
      return props.heroImage ? <Tor {...props} /> : <Veil {...props} />;
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
        <Rule id={theme.ornament} />
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


/* --------------------------------------------------------------- tor ---- */

/** One apple blossom, five petals turned about a centre. The petal is the one
 *  that drifts over the invitation, so the arbour over the altar and the
 *  blossom on the page are the same flower rather than two motifs. */
const PETAL =
  "M11 1.5 C14.5 5 18 8.6 17.4 12.4 C16.8 16.2 13.2 18.9 9.4 18.4 " +
  "C5.6 17.9 2.7 14.6 3.2 10.8 C3.7 7 7.5 4.2 11 1.5 Z";

/**
 * Blossom trained over the altar. Single petals scattered along the arch, not
 * rosettes: five full petals turned about one centre overlap into a disc at
 * this size, and a garland of discs is not blossom. Densest at the crown and
 * thinning down the jambs, because evenly spaced flowers read as beads on a
 * wire.
 */
function Arbour() {
  // Rounded, and that is not tidiness. Math.sin and Math.cos are only
  // implementation-defined to within an ulp, so Node and the browser disagree
  // in the last digit or two and React reports a hydration mismatch on every
  // transform it serialises. Three decimals is past anything an SVG at this
  // scale can show, and identical on both sides.
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  // Stable across renders and exact on both sides of hydration, so neither
  // Math.random nor a sin-hash will do. A bare LCG will not either: for
  // consecutive n it steps by a constant, so the "scatter" comes out a linear
  // ramp and the garland lands in an evenly spaced line. This mixes bits.
  const rnd = (n: number) => {
    let x = Math.imul(n + 1, 2654435761) >>> 0;
    x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0;
    x ^= x >>> 13; x = Math.imul(x, 3266489917) >>> 0;
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };

  const petals = Array.from({ length: 64 }, (_, i) => {
    const a = Math.PI * (1 - i / 63);
    const lift = Math.pow(Math.sin(a), 0.7);
    const off = 1 + (rnd(i + 1) - 0.5) * 0.14;
    return {
      x: r3(50 + 47 * Math.cos(a) * off),
      y: r3(55 - 50 * Math.sin(a) * off),
      s: r3(0.1 + 0.17 * lift * (0.6 + rnd(i + 97) * 0.8)),
      r: Math.round(rnd(i + 501) * 360),
      tone: "abc"[i % 3],
    };
  });

  return (
    <svg
      className="tor-arbour"
      /* Matches the element's own 100:59 box, so "meet" fills it exactly
         instead of letterboxing the arch into the middle. */
      viewBox="0 0 100 59"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {petals.map((p, i) => (
        <path
          key={i}
          className={`bl-${p.tone}`}
          d={PETAL}
          transform={`translate(${p.x} ${p.y}) rotate(${p.r}) scale(${p.s}) translate(-10 -10)`}
        />
      ))}
    </svg>
  );
}

/**
 * A door hung in a wall, and a camera that walks through it. Drag the leaves
 * apart, or tap.
 *
 * Everything is driven by one custom property, `--open`, running 0 to 1: the
 * dolly, the leaves' swing, the light on the threshold, the flood at the end
 * and the type fading off the front. That is what lets a finger drag and a
 * button tap share a single mechanism, the drag sets `--open` directly with
 * transitions off, the tap transitions it to 1, instead of two animation
 * paths that have to be kept looking alike.
 *
 * The leaves swing inward on a real hinge and are clipped by the opening they
 * hang in, which is the difference between a door and two rectangles sliding
 * across a photograph: a door has a wall around it, a jamb it sits in, and
 * somewhere to go. The handover happens at the whiteout rather than after it,
 * so the cover mounts behind a frame that is already pure light.
 *
 * Progress is real: the door cannot be opened until the photograph has
 * actually decoded, because opening onto a blank frame is worse than making
 * someone wait half a second.
 */
function Tor({ names, m, theme, heroImage, film, filmPoster, filmMobile, filmMobilePoster, mark, onOpen }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const [bloom, setBloom] = useState(false);
  const startX = useRef(0);
  const spanX = useRef(1);
  const openRef = useRef(0);

  // Which cut a screen gets. Resolved on the client, because the server has
  // no viewport: null until then, which is why nothing is decoded or loaded
  // on the first pass. It follows a rotation, but never mid-play, swapping
  // the source out from under a running clip would restart it.
  const [portrait, setPortrait] = useState<boolean | null>(null);
  useEffect(() => {
    if (typeof matchMedia === "undefined") { setPortrait(false); return; }
    const mq = matchMedia("(max-aspect-ratio: 1/1)");
    const apply = () => setPortrait(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const usesMobile = portrait === true && !!filmMobile;
  const activeFilm = usesMobile ? filmMobile : film;
  const activePoster = (usesMobile ? filmMobilePoster : filmPoster) ?? filmPoster;

  // The <video> carries no src in the markup: which cut it wants is not known
  // until the client says how tall the screen is. Set here rather than in JSX
  // so a rotation before the tap re-points it instead of leaving the wrong
  // aspect loaded.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !activeFilm || done) return;
    if (v.getAttribute("src") === activeFilm) return;
    v.setAttribute("src", activeFilm);
    if (activePoster) v.setAttribute("poster", activePoster);
    v.load();
  }, [activeFilm, activePoster, done]);

  // decode() resolves when the pixels are ready to paint, which is later than
  // onload and is the moment that actually matters here.
  // With a clip it is the poster that has to be on screen before the gate can
  // be opened, not the cover photograph: the poster IS the first frame.
  const gateImage = film ? (portrait === null ? null : activePoster) : heroImage;
  useEffect(() => {
    if (!gateImage) return;
    let live = true;
    const img = new Image();
    img.src = gateImage;
    const finishLoad = () => { if (live) setReady(true); };
    (img.decode ? img.decode().then(finishLoad, finishLoad) : Promise.resolve().then(finishLoad));
    const bail = setTimeout(finishLoad, 4000);
    return () => { live = false; clearTimeout(bail); };
  }, [gateImage]);

  const set = (v: number) => { openRef.current = v; setOpen(v); };

  function complete() {
    if (done) return;
    setDone(true);
    setDragging(false);
    // A supplied clip is the invitation's opening rather than decoration, so
    // it runs for everyone, before the reduced-motion bail, not after it.
    // Someone who asked their system for less movement still gets the film;
    // what they would otherwise get is a half-second flash to the page
    // background, which is not obviously the kinder of the two.
    if (film) {
      // Fades the type off the front.
      set(1);
      // The still underneath is this clip's own first frame, so starting
      // playback changes nothing on screen: the picture simply begins to move.
      // Nothing is swapped and nothing re-lays out, which is the whole reason
      // it reads as an animation rather than as a video that began.
      const v = videoRef.current;
      // Autoplay can still be refused; the timer hands over either way.
      v?.play().catch(() => { /* the timer still runs */ });
      const runs = v && Number.isFinite(v.duration) && v.duration > 0
        ? v.duration * 1000 - 80
        : 2000;
      // The clip does not have to end on white, so the handover is covered
      // here instead. Short: the cut decelerates onto its last frame, and a
      // longer bloom would wash out the arrival it exists to hand over from.
      const hand = Math.max(400, runs);
      setTimeout(() => setBloom(true), Math.max(0, hand - 200));
      setTimeout(onOpen, hand);
      return;
    }
    // Opting out of motion is about movement, not about hard cuts. The leaves
    // stay shut and the gate cross-dissolves instead of swinging, because a
    // gate that is simply gone on the same frame reads as a dead button.
    if (prefersReducedMotion()) { setTimeout(onOpen, 620); return; }
    set(1);
    // Just short of the end of the dolly, so the cover mounts while the
    // threshold is still blown out and the two never cut against each other.
    setTimeout(onOpen, 1900);
  }

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!ready || done) return;
    startX.current = e.clientX;
    // Half the width of a leaf is a full open, so the gesture is short enough
    // to finish with a thumb.
    spanX.current = Math.max(1, e.currentTarget.clientWidth * 0.42);
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    // A clip cannot be scrubbed open, so with one the gate is tap-only.
    if (!dragging || done || film) return;
    // Either direction opens: nobody should have to guess which way the
    // leaves go.
    set(Math.min(1, Math.abs(e.clientX - startX.current) / spanX.current));
  }

  function onUp() {
    if (!dragging || done) return;
    setDragging(false);
    // A press that never travelled is a tap, and a tap anywhere on the gate
    // opens it, the whole door is the target, which is what everyone tries
    // first and what the hint has always promised. Only a deliberate part-way
    // drag that is then released short snaps shut again.
    if (openRef.current > 0.34 || openRef.current < 0.03) complete();
    else set(0);
  }

  return (
    <div
      className={`tor ${film ? "has-film" : ""} ${filmMobile ? "has-film-mobile" : ""} ${dragging ? "is-dragging" : ""} ${done ? "is-parting" : ""} ${ready ? "is-ready" : ""}`}
      style={{ "--open": open } as React.CSSProperties}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {film ? (
        <div className="tor-film" aria-hidden="true">
          {/* Sized and fitted identically to the video, so the two are pixel
              identical and the first painted frame lands on top of its own
              still without a flicker. The picture element picks the cut with
              no script, so the very first paint is already the right aspect, 
              the video's own src cannot be, and follows on the client. */}
          <picture>
            {filmMobilePoster && (
              <source media="(max-aspect-ratio: 1/1)" srcSet={filmMobilePoster} />
            )}
            <img src={filmPoster ?? heroImage ?? ""} alt="" draggable={false} />
          </picture>
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            // Handing over on the clip's own end beats any timer we could set.
            onEnded={onOpen}
          />
          <div className={`tor-film-flood${bloom ? " is-lit" : ""}`} />
        </div>
      ) : (
      /* The camera. One element takes the whole dolly, so every piece of
         scenery inside it keeps its alignment for free. */
      <div className="tor-cam" aria-hidden="true">
        <div className="tor-room">
          <span className="tor-floor" />
        </div>

        {/* What lies beyond, clipped to the opening, so the photograph is
            only ever seen through the doorway, never as a backdrop the
            leaves happen to sit on. */}
        <div className="tor-portal">
          {/* The ceremony, seen through the doorway: the aisle running back to
              the altar, blossom trained over it, and the couple mounted at the
              centre the same way the cover mounts them, so the plate the gate
              ends on and the plate the cover opens on are one object. */}
          <div className="tor-altar">
            <span className="tor-aisle" />
            <Arbour />
            <span className="tor-dais" />
            {heroImage && (
              <figure className="tor-couple">
                <img src={heroImage} alt="" draggable={false} />
              </figure>
            )}
          </div>
          <div className="tor-threshold" />
        </div>

        <div className="tor-doors">
          <div className="tor-leaf tor-leaf-l"><span className="tor-panel" /></div>
          <div className="tor-leaf tor-leaf-r"><span className="tor-panel" /></div>
        </div>

        {/* Drawn over the leaves, so they read as hung inside the wall. */}
        <div className="tor-frame" />
        <div className="tor-key"><Ornament id={theme.ornament} size={30} /></div>
        <div className="tor-flood" />
      </div>
      )}

      <div className="tor-plate">
        {mark && <p className="studio-mark tor-mark">{mark}</p>}

        <h1 className="cover-names display tor-names" aria-label={`${names.a} & ${names.b}`}>
          <span aria-hidden="true"><Letters text={names.a} offset={0} /></span>
          <span className="cover-amp" aria-hidden="true">&amp;</span>
          <span aria-hidden="true"><Letters text={names.b} offset={names.a.length + 1} /></span>
        </h1>

        <button
          type="button"
          className="btn tor-btn"
          onClick={complete}
          // Without this the press that taps the button also starts a drag.
          onPointerDown={(e) => e.stopPropagation()}
          disabled={!ready}
        >
          {ready ? m.opener.open : m.opener.preparing}
        </button>

        <p className="tor-hint">{ready ? m.opener.dragToOpen : ""}</p>

        {/* A hairline that fills while the photograph decodes. Quieter than a
            percentage, and it stops when the picture is genuinely ready. */}
        <span className="tor-progress" aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * One span per character so the name can be built letter by letter. The whole
 * name stays on the heading's aria-label and the spans are hidden, so a screen
 * reader still hears "Max & Lena" rather than eleven separate letters.
 */
function Letters({ text, offset }: { text: string; offset: number }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span
          className="ltr"
          key={`${i}-${ch}`}
          style={{ "--i": offset + i } as React.CSSProperties}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}
