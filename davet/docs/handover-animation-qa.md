# Handover — invitation animation & effects QA

**Date:** 2026-09-01 · **Branch:** `main` (uncommitted) · **App:** `davet/`

Context for a fresh session picking this up. The work under test is the
`tor` gate opener, the orchard-blossom overlay, and the scroll chrome
(progress rail + section dots), plus the earlier "open chrome" premium
pass on the `atelier-blanc` theme.

## Running it

```bash
cd davet
npm run dev                     # sample invitation at /max-und-lena
npm run typecheck && npm test && npm run build
```

The demo store lives in `globalThis` (`src/lib/db/demo.ts`) and **survives
hot reload**. After editing seed data you must restart `next dev`, or the old
objects persist and you will debug a ghost.

Playwright's browsers are not installed. Drive Chrome with the copy
agent-browser ships:

```js
chromium.launch({ executablePath:
  "/Users/sonus/.agent-browser/browsers/chrome-148.0.7778.167/" +
  "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" })
```

Frame-accurate work must use Playwright, not agent-browser: each
agent-browser command is a separate process (~500–900 ms), which always
overshoots a 1.5 s transition.

---

## BUGS

### B1 — `heroImage` / `inviteCard` cannot be set by any user  ·  **P0**

The whole photography feature only works for seeded demo data.

- `src/app/api/invite/[id]/route.ts` — the `Patch` zod schema omits both
  fields, so any PATCH carrying them is silently stripped.
- `src/components/builder/Builder.tsx:68` — destructures `heroImage` and
  `inviteCard` out of the payload before saving, deliberately.
- There is no upload UI anywhere in `src/components/`.

**Consequence:** for a real invitation, `heroImage` is always `null`, so
the cover plate, the full-bleed band, the photograph on the WhatsApp share
card, **and the `tor` opener** are all dead. `tor` degrades silently to
`veil` (`Opener.tsx:27`), so a user who picks "Torflügel" in the builder
gets the veil and no error.

This is the centre of the photographer pitch — "her photographs on the
invitation" — and it is currently undeliverable outside the demo.

**Fix shape:** add `heroImage`/`inviteCard` to the `Patch` schema (as
`z.string().max(500).nullable().optional()`), stop stripping them in the
builder, and add either a URL field or real upload. Storage choice is a
product decision, so ask before building it.

### B2 — petals fall at viewport scale inside the builder preview  ·  **P2**

`@keyframes petalFall` translates `118vh` (`globals.css`). In the builder
the renderer sits in a ~672 px phone frame while `vh` still resolves
against the ~900 px window, so petals travel **1.58×** the frame height:
they streak past far too fast and are mostly clipped.

Measured: `petalFall travels 118vh = 1062px, frame is 672px -> 1.58x`.

**Fix shape:** make the distance container-relative (`cqh`, since
`.invite-body` is already `container-type: inline-size` — it would need
`size`), or override `--fall-distance` under `.preview-scope`.

### B3 — printing before the gate is opened yields a near-blank sheet  ·  **P2**

`.cover` gets `min-height: 0` in the print block; `.tor` does not, so it
keeps a full viewport height. The seam also keeps animating.

Measured with `emulateMedia({ media: "print" })` on an unopened
invitation: `min-height = 844px`.

Reachable by Ctrl+P before tapping open. The in-page print button only
appears after opening, so this is browser-menu-only — hence P2.

**Fix shape:** in the `@media print` block, either `.tor { display: none }`
and force the cover to render, or give `.tor` `min-height: 0` and stop the
seam animation.

### B4 — `scroll-behavior: smooth` leaks app-wide  ·  **P2**

Set on bare `html` in `globals.css` for the invitation's dot navigation.
Measured `scrollBehavior === "smooth"` on `/dashboard`; it also affects
`/edit/*`, `/impressum`, `/datenschutz`.

**Fix shape:** scope it to the invitation — e.g. `.invite { scroll-behavior: smooth }`
plus `scroll-behavior: smooth` on the scrolling root only where the dots exist.

### B5 — first `pointermove` of a drag is dropped  ·  **P3**

`onMove` in `Opener.tsx` reads `dragging` from the render closure, so the
first move after `pointerdown` still sees `false` and returns early.
Confirmed in instrumented logs: `onMove {dragging: false}` then
`onDown {ready: true}` then `onMove {dragging: true}`.

Costs one frame at gesture start — imperceptible today, but a latent trap
if the commit threshold is ever tightened.

**Fix shape:** drive the gesture from a ref (`draggingRef`) rather than
state, keeping state only for the class name.

### B6 — blossom rate stepping queries the whole document  ·  **P3**

`apply()` in `Blossom.tsx` calls `document.getAnimations()` and filters by
`animationName` on every rate step of a gust. Correct, and measured cheap
(~59 animations), but it is O(all animations on the page) and will degrade
if more CSS animation is added. It scans the document because the petals
now live in two overlays (`.blossom-back` / `.blossom-front`).

**Fix shape:** hold refs to both containers and use
`el.getAnimations({ subtree: true })` on each.

### B7 — no section navigation below 352 px  ·  **P3, by design, undocumented**

`.dots { display: none }` under `22rem`. A 320 px phone gets the progress
rail but no dots. Intentional (30 px tap targets do not fit), recorded so
nobody files it twice.

### B8 — `will-change: transform` on 28 petals is always on  ·  **P3**

Standing compositor-memory cost even when nothing is scrolling. Fine on
the devices measured; worth revisiting if petal count grows.

---

## Not verified

- **`tor` → `veil` fallback for a null `heroImage`.** Code path reviewed
  (`Opener.tsx:27`) but never executed, because B1 makes `heroImage`
  unsettable. Re-test once B1 is fixed.

---

## Verified good — do not re-test

| Area | Result |
|---|---|
| Idle gate motion | 59 running animations (`torDrift`, `seamBreathe`, `btnSheen`, `petalFall`, `petalTurn`) |
| Petal depth | 28 total; 10 behind the text, 18 in front; stacking back `z:0` / `.invite-body` `z:1` / front `z:5` |
| SSR determinism | 28 petals server-rendered, 28 on client, no hydration warnings |
| Scroll gust | `playbackRate` 1 → 4.13 on a fast flick → eases back to 1 |
| Frame health | 4× CPU throttle: median 16.6 ms, p95 19.6 ms, worst 21.8 ms, **0/119 frames over 50 ms** |
| Drag (mouse) | tracks finger 0.18 → 0.37; commits above 0.34; springs back from 0.12 → 0 |
| Drag (touch) | `pointerType: "touch"` reaches `--open` 0.70 |
| Keyboard | first Tab focuses the gate button; Enter opens |
| Reduced motion | gate skipped, blossom `display: none`, drag still opens |
| Print after opening | blossom/rail/dots/countdown/RSVP hidden; reveals forced visible; names print solid ink; `.cover` min-height 0 |
| `cover-arrive` | fires after drag as well as tap |
| Double tap | one `.cover`, no duplicate, no page errors |
| 320 px | no horizontal overflow, gate fits |
| Regression | `veil` opener and the eight framed themes unaffected (`data-chrome` scoping holds) |

## Two bugs already fixed this session, for context

- **Native image drag killed the gesture.** The 2 % seam gap made the
  `<img>` the pointer target; dragging an image fires `pointercancel`,
  which tripped `onUp` and reset the drag. Fixed with
  `pointer-events: none` on every decorative layer inside `.tor`.
- **A stale rAF id disabled the scroll rail permanently.** `ScrollChrome`
  cancelled the pending frame on cleanup but never reset the ref that *is*
  the throttle gate, so React's dev double-invoke left it non-zero and
  every later `onScroll` returned early. Same pattern was pre-emptively
  avoided in `Blossom.tsx`.

## Database migrations — must ship

`supabase/schema.sql` enumerates values in CHECK constraints, so three
additions each needed one. All work in demo mode and fail against a real
database without the migration.

- `migrations/0001_secular_tradition.sql` — `tradition` gains `'secular'`
- `migrations/0002_address_form.sql` — new `address_form` column (du/Sie)
- `migrations/0003_tor_opener.sql` — `opener` gains `'tor'`

**Lesson for the next feature:** any new value in `THEME_IDS`,
`OPENER_IDS`, `TRADITIONS` or `ADDRESS_FORMS` needs a matching migration.
Grep `schema.sql` for `check (` before adding one.

## Placeholders still to replace

- `PITCH_STUDIO` in `src/lib/db/demo.ts` — `viciosostudios.de` and
  `+49 40 5550188` are invented. Replace before sending the link.
- `NEXT_PUBLIC_OPERATOR_*` env vars — until set, `/impressum` and
  `/datenschutz` render a visible warning banner instead of silently
  publishing `[Betreibername eintragen]`.
- Legal texts are accurate to what the code does but have **not** been
  reviewed by a German lawyer.

## Files owning this behaviour

```
src/components/invite/Opener.tsx      Tor gate: --open model, drag, letters
src/components/invite/Blossom.tsx     28 petals, 3 layers, scroll coupling
src/components/invite/ScrollChrome.tsx  progress rail + section dots
src/components/invite/Invite.tsx      mounts the above; `arrived` flag
src/app/globals.css                   gate choreography, petals, print,
                                      open-chrome premium pass
src/lib/themes.ts                     lettering / chrome tokens
```
