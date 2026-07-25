-- Tri-series format: exactly 3 sides, double round-robin (each pair plays
-- twice), top 2 meet in a final. Reuses the existing "final-only" playoff
-- structure, so no new columns — just widening the algorithm enum.

begin;

alter table public.tournaments
  drop constraint if exists tournaments_algorithm_check;

alter table public.tournaments
  add constraint tournaments_algorithm_check
  check (algorithm in ('round-robin', 'single-elimination',
                        'double-elimination', 'triple-elimination', 'series',
                        'tri-series'));

commit;
