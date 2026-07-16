-- Tournament schedule window.
--
-- Adds an optional planned start/end for a tournament ("match night" window,
-- e.g. Fri 11pm → Sat 2am) so it can be shown in the app and printed onto the
-- shareable fixture card. Both nullable: existing tournaments have no schedule
-- and stay valid.

begin;

alter table public.tournaments
  add column if not exists scheduled_start timestamptz;

alter table public.tournaments
  add column if not exists scheduled_end timestamptz;

commit;
