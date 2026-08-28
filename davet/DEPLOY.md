# Deploying Davet to a free vercel.app subdomain

Roughly 20 minutes. Everything below fits in free tiers; the caveats that make
"free" conditional are at the end, and you should read them before inviting real
couples.

## 1. Supabase

1. Create a project at supabase.com. Note its region — pick one near your guests.
2. Open the SQL editor, paste all of `supabase/schema.sql`, run it.
3. Settings → API. Copy three values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

The service role key bypasses row-level security. It is a server-only secret:
never expose it to the browser, and never give it a `NEXT_PUBLIC_` name.

## 2. Push to GitHub

The repository is initialised and committed already, with no remote.

    git remote add origin git@github.com:<you>/davet.git
    git push -u origin main

## 3. Import on Vercel

1. vercel.com → Add New → Project → import the repository.
2. Framework preset is detected as Next.js. Leave the build settings alone.
3. Add environment variables before the first deploy:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 1 |
   | `RATE_LIMIT_SALT` | any long random string |
   | `CRON_SECRET` | any long random string |

   `NEXT_PUBLIC_SITE_URL` is not needed: share links derive from Vercel's own
   production URL. Set it only when you attach a custom domain.

4. Deploy. You get `https://<project>.vercel.app`.

## 4. Point Supabase auth back at the deployment

Supabase → Authentication → URL Configuration:

- Site URL: `https://<project>.vercel.app`
- Redirect URLs: add `https://<project>.vercel.app/auth/callback`

Skip this and magic-link sign-in sends people to localhost.

## 5. Check it

- `/` loads and shows eight themes.
- `/login` sends a magic link that returns you to `/dashboard`.
- Create an invitation, publish it, open it in a private window.
- Submit an RSVP as a guest; confirm it appears under Responses.
- `curl -H "Authorization: Bearer $CRON_SECRET" https://<project>.vercel.app/api/keepalive`

## What "free" actually costs

**Supabase pauses free projects after about a week of inactivity.** A published
invitation has to stay reachable for months, so this is the one that would
genuinely take a wedding site down. `vercel.json` schedules a daily GET to
`/api/keepalive` — one cheap query, which is enough to keep the project marked
active. Vercel's Hobby plan allows one cron run per day, which is exactly what
this uses. If you would rather not depend on that, Supabase Pro is $25/month.

**Vercel's Hobby plan is for non-commercial use.** The moment Davet charges
anyone, it needs Pro at $20/month. Confirm against Vercel's current terms
yourself — this changes, and it is their call, not mine.

**Free tier ceilings worth knowing**: Supabase gives 500 MB of database and
50,000 monthly active users, far beyond what invitations consume. Photo uploads
are not built yet; when they are, storage is the limit that will bite first.

**A custom domain is free on Vercel**, you only buy the domain itself. Add it in
the project's Domains tab, then set `NEXT_PUBLIC_SITE_URL` to it and update the
two Supabase auth URLs, or previously sent links and magic links will disagree.

## Before real couples use it

- **Schedule the retention purge.** `purge_old_guest_data()` exists but nothing
  calls it. In the Supabase SQL editor:

      select cron.schedule('davet-purge', '0 3 * * *',
                           'select public.purge_old_guest_data()');

  Guest names and RSVP replies are personal data belonging to EU residents.
  Storing them indefinitely is the part of GDPR that is easy to get wrong.

- **Test on a real iPhone.** The Safari work — `100dvh` covers, `-webkit-`
  prefixed foil lettering, Pointer Events on the scratch opener — is written to
  the documented behaviour but has never run on an actual device.
