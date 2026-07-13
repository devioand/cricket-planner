-- Flexible, config-driven playoffs.
--
-- Widens the playoff_format enum, stores the resolved/authored playoff config as
-- JSON, and adds the canonical champion flag + display label to matches.

begin;

-- 1. Widen the playoff_format enum (was 'world-cup' | 'league').
alter table public.tournaments
  drop constraint if exists tournaments_playoff_format_check;

alter table public.tournaments
  add constraint tournaments_playoff_format_check
  check (playoff_format in ('none', 'final-only', 'world-cup', 'league', 'custom'));

-- 2. Store the playoff structure used to generate the bracket (null for legacy
--    rows and for the "none" format).
alter table public.tournaments
  add column if not exists playoff_config jsonb;

-- 3. Canonical champion-decider flag + human label on matches. `playoff_type`
--    is already unconstrained text, so custom labels need no change there.
alter table public.matches
  add column if not exists is_final boolean not null default false;

alter table public.matches
  add column if not exists playoff_label text;

commit;
