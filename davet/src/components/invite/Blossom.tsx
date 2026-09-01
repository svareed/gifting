"use client";
import { useEffect, useMemo, useRef } from "react";

/**
 * Orchard blossom drifting over the page.
 *
 * The reference this emulates uses pink cherry blossom, which would fight a
 * monochrome identity; these are apple blossom, because the ceremony in this
 * invitation happens in an Obstgarten and an orchard in June is what is
 * actually falling.
 *
 * Three things make it read as depth rather than as a flat overlay of dots:
 * petals come in three layers with their own size, speed and opacity ranges;
 * each one turns in 3D so it goes edge-on and catches light instead of
 * spinning flat; and the whole field speeds up when the page is scrolled
 * quickly, so the blossom answers the reader rather than ignoring them.
 *
 * Falling and turning are animated purely by CSS transform, so the compositor
 * owns every frame. Scroll coupling is the one piece that needs script, and it
 * uses updatePlaybackRate — built for exactly this — rather than rewriting
 * animation-duration, which would make every petal jump.
 */

type Layer = {
  key: string;
  count: number;
  size: [number, number];
  op: [number, number];
  fall: [number, number];
  sway: [number, number];
};

/** Far is small, faint and slow; near is large, solid and quick. */
const LAYERS: Layer[] = [
  { key: "far", count: 10, size: [8, 13], op: [0.3, 0.48], fall: [26, 38], sway: [5.5, 8] },
  { key: "mid", count: 10, size: [13, 19], op: [0.55, 0.74], fall: [17, 26], sway: [4, 6] },
  { key: "near", count: 8, size: [18, 26], op: [0.7, 0.9], fall: [11, 17], sway: [3, 4.6] },
];

/** Deterministic, so the server and the client agree on the first paint. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
const lerp = (r: number, [a, b]: [number, number]) => a + r * (b - a);

export function Blossom() {
  const root = useRef<HTMLDivElement>(null);

  const petals = useMemo(
    () =>
      LAYERS.flatMap((layer, li) =>
        Array.from({ length: layer.count }, (_, i) => {
          const s = li * 100 + i * 7;
          const r = (n: number) => rand(s + n);
          return {
            id: `${layer.key}-${i}`,
            layer: layer.key,
            left: `${(r(1) * 106 - 3).toFixed(2)}%`,
            size: `${lerp(r(2), layer.size).toFixed(1)}px`,
            opacity: lerp(r(3), layer.op).toFixed(2),
            fall: `${lerp(r(4), layer.fall).toFixed(1)}s`,
            sway: `${lerp(r(5), layer.sway).toFixed(1)}s`,
            // Negative delays start the field mid-flight, so nothing has to
            // fall from the top before the first petal is visible.
            delay: `${(-r(6) * 34).toFixed(1)}s`,
            drift: `${(r(7) * 90 - 45).toFixed(0)}px`,
            spin: `${(r(8) * 300 - 150).toFixed(0)}deg`,
            tilt: (0.2 + r(9) * 0.6).toFixed(2),
          };
        }),
      ),
    [],
  );

  /* --- scroll velocity ---------------------------------------------------
   * Scrolling hard should feel like a gust. The rate is raised by scroll
   * speed and eased back to 1, and the loop only runs while it is away from
   * 1 — an idle page costs no frames at all.
   */
  useEffect(() => {
    if (
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let lastY = window.scrollY;
    let lastT = performance.now();
    let rate = 1;
    let applied = 1;
    let raf = 0;

    // Petals live in two separate overlays — one behind the content, one in
    // front — so they are collected by animation name rather than by walking
    // a single container.
    const apply = (r: number) => {
      for (const a of document.getAnimations()) {
        const name = (a as CSSAnimation).animationName;
        if (name === "petalFall" || name === "petalTurn") a.updatePlaybackRate(r);
      }
    };

    const tick = () => {
      rate += (1 - rate) * 0.055;
      if (Math.abs(rate - applied) > 0.04) {
        applied = rate;
        apply(applied);
      }
      if (Math.abs(rate - 1) < 0.03) {
        rate = 1;
        applied = 1;
        apply(1);
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastY);
      const dt = Math.max(16, now - lastT);
      lastY = window.scrollY;
      lastT = now;
      // px/ms into a multiplier, capped so a flick never looks like a blizzard.
      rate = Math.min(4.5, Math.max(rate, 1 + (dy / dt) * 2.4));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      // Reset the gate as well as cancelling it: a stale id here would stop
      // the next mount's loop from ever starting.
      raf = 0;
    };
  }, []);

  const field = (which: "back" | "front") => (
    <div className={`blossom blossom-${which}`} aria-hidden="true" ref={which === "front" ? root : undefined}>
      {petals
        .filter((p) => (which === "back" ? p.layer === "far" : p.layer !== "far"))
        .map((p) => (
        <span
          key={p.id}
          className={`petal petal-${p.layer}`}
          style={
            {
              left: p.left,
              "--size": p.size,
              "--petal-opacity": p.opacity,
              "--fall": p.fall,
              "--sway": p.sway,
              "--delay": p.delay,
              "--drift": p.drift,
              "--spin": p.spin,
              "--tilt": p.tilt,
            } as React.CSSProperties
          }
        >
          <svg viewBox="0 0 20 20" width="100%" height="100%">
            {/* One apple-blossom petal. Deliberately asymmetric and leaning:
                a symmetrical blob at this size reads as a water droplet. */}
            <path
              d="M11 1.5 C14.5 5 18 8.6 17.4 12.4 C16.8 16.2 13.2 18.9 9.4 18.4 C5.6 17.9 2.7 14.6 3.2 10.8 C3.7 7 7.5 4.2 11 1.5 Z"
              fill="currentColor"
            />
          </svg>
        </span>
      ))}
    </div>
  );

  // The far layer sits behind the text; the nearer two fall in front of it.
  return (
    <>
      {field("back")}
      {field("front")}
    </>
  );
}
