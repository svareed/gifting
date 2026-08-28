# Davet — Wedding Invitation Builder

**Date:** 2026-08-24
**Status:** Approved, in implementation

## Problem

Couples pay designers or hand-write one-off code to get a wedding invitation
website. Both reference implementations that motivated this project
(`ahsanwedsafra.vercel.app`, `roshil-asna-wedding.roseroshil.workers.dev`) are
bespoke builds: one a Next.js app, one a 4.7 MB single HTML file with a
base64-inlined MP3. Neither is reusable.

Davet turns that work into a product. A couple enters data; the site is
rendered, previewed, and published.

## Audience

Muslim weddings in the English / German / Turkish diaspora. Narrow on purpose:
it lets the product ship Nikah and Walima event presets, a Qur'an verse library
in three languages, and Arabic typography as defaults rather than as fields the
couple must fill in themselves.

## Decisions

| Decision | Choice | Rejected |
|---|---|---|
| Publishing | One Next.js app, `/[slug]` renders from DB | Per-couple Vercel projects; static HTML export |
| i18n | Chrome labels translated; couple's own text typed once | Guest-side switcher; machine translation |
| Backend | Supabase — Postgres, magic-link auth, storage, RLS | Neon + Auth.js; Convex |
| Layout | One scroll structure | Multiple templates; template marketplace |
| Style | 8 themes x 4 openers, theme = token bundle | 3 palettes only |
| Photos | Hero photo + invite card | None; full gallery |
| Builder | One page, collapsible sections, live preview | Routed wizard; WYSIWYG |
| Auth | Email magic link | Secret URL; OAuth |

## Architecture

### The spine: one renderer, three call sites

`<Invite data={...} />` renders the invitation. It is used by:

- `/[slug]` — the public page
- `/preview/[id]` — owner-only draft render
- the builder's live preview — same component in an iframe at phone width

Preview fidelity is therefore structural, not a feature to maintain. The
preview cannot drift from the published page because they are the same code.

### Data model

    invites   owner_id, slug, status, locale, theme, opener, timezone,
              partner_a_name, partner_b_name, hero_image, invite_card,
              sections jsonb, rsvp_deadline, info_weather/dress/parking
    events    invite_id, sort, preset_key | custom_name, venue_name,
              venue_address, maps_url, starts_at timestamptz, note
    families  invite_id, side (a|b), person_name, parents, grandparents
    verses    invite_id, sort, library_key | custom_arabic + custom_text
    rsvps     invite_id, name, attending, guest_count, message, ip_hash
    wishes    invite_id, name, message, status (pending|approved|hidden)

`verses.library_key` and `events.preset_key` store references, not copied text,
so changing an invitation's language re-renders both without retyping. Free-text
overrides exist on both.

### Row-level security

Owners have full CRUD on their own rows. Anonymous users get `SELECT` only where
`invites.status = 'published'`, and on `wishes` only where `status = 'approved'`.

Anonymous writes are denied at the database. RSVP and wish submissions go through
Next.js route handlers holding the service role, so validation, honeypot checks,
and rate limiting cannot be bypassed by posting directly to PostgREST.

### Seeded defaults

A new invitation is never blank. It is created pre-filled with a working example
in the chosen language: two events (Nikah + Reception), two verses, family
skeletons, and "things to know" text. The user's task becomes editing rather than
creating, which is a materially easier task and the single largest lever on
completion rate.

Supporting rules: autosave with no Save button; collapsed sections show honest
counts ("Events - 2", "Families - not added") rather than a progress bar that
overstates completeness; the Publish button reports what is missing instead of
validating fields while the user is still typing.

## Internationalisation

Three catalogues of interface chrome only. The couple's own words are entered
once, as entered. Locale is stored on the invitation; the guest URL carries no
locale segment.

Three failure modes are designed against explicitly:

- **German compounds** (Veranstaltungsort, Hochzeitsempfang) overflow narrow
  mobile labels. Layout is tested against the longest string across all three
  catalogues, not against English.
- **Turkish dotted and dotless I.** `text-transform` is applied only with a
  correct `lang` attribute, and never to user-entered names.
- **Countdown correctness.** The target is one absolute UTC instant derived from
  the event's local time and the invitation's timezone, so guests in Berlin and
  Kochi see the same remaining time.

Arabic verse blocks are `dir="rtl"` inside an otherwise LTR page.

## Theme system

A theme is a token bundle, not a template. Five axes: palette, type pairing,
ornament set, surface texture, motion profile. Adding a theme is a data change.

Eight ship at launch: Ivory & Gold, Onyx & Champagne, Emerald & Brass, Iznik
Blue, Marble & Gilt, Rosewater, Sand & Terracotta, Kasavu.

Four openers, independent of theme: Veil, Foil, Envelope, Direct. Eight themes
times four openers gives 32 first impressions from one layout and one set of
translations.

Only the active theme's fonts load, self-hosted and subset. Eight themes must not
mean eight font families on every invitation.

The theme picker shows rendered invitations rather than colour swatches.

## Browser support

Baseline Chrome 111+ and Safari 16.4+ (iOS 16.4+), which covers `oklch`,
`:has()`, container queries, and `dvh` without polyfills.

Safari-specific hazards addressed in code:

1. `new Date('2026-08-27 12:00')` is `Invalid Date` in Safari and valid in
   Chrome. All timestamps move as ISO-8601 UTC. This is the countdown's most
   likely failure and it fails silently for half the audience.
2. `100vh` is cropped by the iOS URL bar; full-screen covers use `100dvh`.
3. `backdrop-filter`, `mask-image`, and `background-clip: text` need `-webkit-`
   prefixes, without which the foil lettering in the premium themes disappears.
4. iOS zooms the page when an input below 16px receives focus; builder fields
   are at least 16px.
5. Audio cannot autoplay without a genuine user gesture.
6. Scroll-driven CSS animations exist in Safari 26 but not 17 or 18; an
   IntersectionObserver fallback drives reveals, and `prefers-reduced-motion`
   is honoured.
7. The Foil opener uses Pointer Events with `touch-action: none`.
8. `text-wrap: balance` is Safari 17.4+ and degrades harmlessly.

## Risks

**GDPR.** RSVPs collect names and guest counts from EU residents. The RSVP form
carries a privacy notice, deletion cascades when an invitation is deleted, and
responses are purged on a retention schedule after the wedding date.

**Supabase free tier pauses projects after roughly seven days of inactivity.** A
published invitation must stay reachable for months. This is a launch blocker
resolved by the paid tier, not by application code.

## Testing

- Unit: slug generation, and date and countdown formatting across three locales
  and multiple timezones.
- Integration on RLS specifically: anonymous users cannot read a draft and cannot
  read another couple's RSVPs. These are security tests and are not optional.
- End to end: create, fill, publish, guest RSVP, appears in dashboard. Plus a
  three-locale render snapshot with German as the overflow canary.
- Visual regression across themes, locales, Chromium and WebKit. WebKit under
  Playwright is not iOS Safari, so one manual device pass precedes launch.

## Not in v1

Photo gallery, custom domains, seating charts, gift registry, multiple languages
per invitation, template marketplace, payments, guest email blasts, RSVP
reminders.
