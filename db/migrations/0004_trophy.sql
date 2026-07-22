-- Customizable champion trophies.
--
-- Stores the trophy a user designs in the setup wizard (shape + metal/color)
-- as JSON on the tournament. Null for tournaments created before trophies
-- existed; the UI falls back to a default gold cup.
--
-- Note: on the shared database this column was already added out-of-band, so
-- this migration is largely for the record — `if not exists` makes re-running
-- it a safe no-op there, while still creating the column on any fresh database.

begin;

alter table public.tournaments
  add column if not exists trophy jsonb;

commit;
