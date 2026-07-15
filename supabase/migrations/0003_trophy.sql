-- Customizable champion trophies.
--
-- Stores the trophy a user designs in the setup wizard (shape + metal/color +
-- name + engraving) as JSON on the tournament. Null for tournaments created
-- before trophies existed; the UI falls back to a default gold cup.

begin;

alter table public.tournaments
  add column if not exists trophy jsonb;

commit;
