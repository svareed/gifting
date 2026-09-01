-- Adds the secular quote library's tradition.
--
-- schema.sql is the shape of a fresh install; this is the same change for a
-- database that already exists. Without it every attempt to save a secular
-- invitation fails the CHECK constraint, which is the German default case:
-- most couples marrying here want a line from a film or a poem, not scripture.
--
-- The studio-mark section needs no migration: `sections` is jsonb, and a key
-- that is absent reads as false.

alter table public.invites
  drop constraint if exists invites_tradition_check;

alter table public.invites
  add constraint invites_tradition_check
  check (tradition in ('islamic', 'christian', 'secular'));
