"use client";
import { useEffect, useRef, useState } from "react";
import type { Messages } from "@/lib/i18n";

export type NavSection = { id: string; label: string };

/**
 * The hairline that shows how far through the invitation you are, and the dots
 * that jump between its sections.
 *
 * Both exist because this is a long single page read on a phone: the reference
 * invitation solves the same problem with slide dots, and without something
 * like it a guest scrolling for the address has no idea how much is left.
 *
 * Scroll work is throttled to one animation frame and the listener is passive,
 * so it cannot make the scroll itself janky.
 */
export function ScrollChrome({ sections, m }: { sections: NavSection[]; m: Messages }) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const frame = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      // Resetting the ref matters as much as cancelling: it is the throttle
      // gate, so leaving a stale id behind means the next mount's onScroll
      // returns early on its very first call and the rail never moves again.
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, []);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => Boolean(e));
    if (!els.length || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        // The entry closest to the middle of the screen wins, so a short
        // section between two tall ones still registers.
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setActive(best.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [sections]);

  return (
    <>
      <div className="scroll-rail" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <nav className="dots" aria-label={m.nav.sections}>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`dot ${active === s.id ? "is-on" : ""}`}
            aria-current={active === s.id ? "true" : undefined}
          >
            <span className="sr-only">{s.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
