# Davet

Wedding invitations, without the web developer. A couple enters their data,
picks a style and a language, previews it, and publishes to one link.

Built for Muslim weddings across the English / German / Turkish diaspora: Nikah
and Walima event presets, a Qur'an verse library in three languages, and Arabic
typography ship as defaults rather than as fields anyone has to fill in.

## Run it

    npm install
    npm run dev

With no environment variables set, Davet runs in **demo mode**: an in-memory
seeded store, no signup, no database. Everything renders and the builder works;
nothing survives a restart. Visit `/` and follow "Start an invitation", or see
`/amir-leyla` for the seeded example.

To persist, copy `.env.example` to `.env.local`, create a Supabase project, run
`supabase/schema.sql` against it, and fill in the three keys.

## For venues, not only couples

An invitation belongs to an **organisation** — a hall or a planner — not to a
login. `src/lib/org.ts` creates one on first use, its details land at the foot
of every invitation it publishes, and `PLAN_QUOTA` in `src/lib/types.ts` is
what "unlimited" means on the Profi tier.

**A guest list is what makes a headcount safe to cater against.** Each
household holds its own link (`/slug?g=token`) and a seat allowance. The RSVP
route clamps a reply to that allowance and keeps one row per household, so a
second reply corrects the first instead of inflating the total. Without a guest
list the public form still works — it just is not a number anyone should buy
food against.

**Reminders are computed, not queued**, counting back 14 and 7 days from the
reply date, so moving the date moves the reminders. `GET /api/reminders` is the
daily run: it sends email where a provider is configured, and leaves the rest
in the dashboard as click-to-send WhatsApp messages, which is what a hall
actually does by hand.

## How it fits together

**One renderer, three call sites.** `src/components/invite/Invite.tsx` renders
the invitation, and is used by the public page (`/[slug]`), the owner's draft
preview (`/preview/[id]`), and the builder's live preview. Preview fidelity is
structural: the preview cannot drift from the published page because they are
the same component.

**A theme is a token bundle, not a template.** `src/lib/themes.ts` holds eight
themes as palette + type pairing + ornament + surface + motion. Adding a ninth
is a data change — it appears in the picker, the renderer, and the OG image with
no other edit. Four openers (veil, foil, envelope, direct) compose with all
eight, giving 32 first impressions from one layout and one set of translations.

**Translations cover chrome only.** The couple's own words are typed once.
Event names and verses are stored by key, so changing an invitation's language
relabels the programme and re-renders the verses without retyping anything.

**Guest writes never touch the database directly.** RSVP and wish submissions go
through route handlers holding the service role, so validation, the honeypot,
and rate limiting cannot be bypassed by posting straight at PostgREST. RLS in
`supabase/schema.sql` is the second line of defence.

## Deploying

See `DEPLOY.md`. Short version: Supabase for data, Vercel for the app, both on
free tiers, with a daily cron keeping the Supabase project from pausing.

Note that `next start` runs in production mode, where Davet refuses to use the
in-memory demo store. To run a production build locally, opt in explicitly:

    ALLOW_DEMO_IN_PRODUCTION=1 npm run start

## Testing

    npm test          # unit: dates across locales and zones, slugs, catalogues
    npm run build     # typecheck plus production build

## Two things to settle before real couples use it

**Supabase free-tier projects pause after about seven days of inactivity.** A
published invitation has to stay reachable for months. This needs the paid tier
or a keep-alive — it is an operations problem, not a code one.

**GDPR.** RSVPs collect names and guest counts from EU residents. The RSVP form
carries a privacy notice, deletion cascades when an invitation is deleted, and
`purge_old_guest_data()` clears responses 90 days after the last event — but it
needs scheduling with pg_cron (the invocation is in `supabase/schema.sql`).

## Not built

Photo gallery, custom domains, seating charts, gift registry, several languages
on one invitation, template marketplace, payments, guest email blasts, RSVP
reminders. The design spec in `docs/superpowers/specs/` records why.
