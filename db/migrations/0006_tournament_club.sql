-- Link each tournament to the club it belongs to. Until now a tournament
-- belonged only to a *user* (tournaments.user_id), so per-club trophies/history
-- weren't real — every club showed the same games. This adds the missing link.
--
-- Nullable + ON DELETE SET NULL, on purpose:
--   * legacy rows (created before clubs) have no club — that's fine, they read
--     back under whatever club is active (the "null falls back" behaviour);
--   * deleting a club must NEVER delete its games — they simply detach to null.
--
-- The runner wraps each migration in a transaction, so no explicit BEGIN/COMMIT.

alter table public.tournaments
  add column if not exists club_id uuid references public.clubs(id) on delete set null;

create index if not exists tournaments_club_id_idx on public.tournaments (club_id);
