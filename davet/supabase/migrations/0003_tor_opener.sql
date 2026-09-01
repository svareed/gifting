-- Adds the "tor" opener: two leaves parting over the cover photograph.
--
-- Same shape of problem as 0001. The CHECK constraint enumerates openers, so
-- without this an invitation set to "tor" cannot be saved at all — it works in
-- demo mode and fails the moment there is a real database behind it.
--
-- The blossom section needs no migration: `sections` is jsonb, and a key that
-- is absent reads as false.

alter table public.invites
  drop constraint if exists invites_opener_check;

alter table public.invites
  add constraint invites_opener_check
  check (opener in ('veil', 'foil', 'envelope', 'direct', 'tor'));
