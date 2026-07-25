-- Series format: two sides, best-of-N head-to-head (no round-robin table).
--
-- Widens the algorithm enum to include 'series', and stores the chosen best-of
-- length (3/5/7) on the tournament. Only meaningful when algorithm = 'series'.

begin;

alter table public.tournaments
  drop constraint if exists tournaments_algorithm_check;

alter table public.tournaments
  add constraint tournaments_algorithm_check
  check (algorithm in ('round-robin', 'single-elimination',
                        'double-elimination', 'triple-elimination', 'series'));

alter table public.tournaments
  add column if not exists series_best_of integer not null default 3;

alter table public.tournaments
  drop constraint if exists tournaments_series_best_of_check;

alter table public.tournaments
  add constraint tournaments_series_best_of_check
  check (series_best_of in (3, 5, 7));

commit;
