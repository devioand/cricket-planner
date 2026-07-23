-- Clubs and their saved players, persisted per user account (moved off the
-- device-local store). A user can own several clubs; a player is just a name and
-- does NOT need an account — `user_id` is nullable, reserved for future claiming.
--
-- The runner wraps each migration in a transaction, so no explicit BEGIN/COMMIT.

create table if not exists public.clubs (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references public."user"(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clubs_user_id_idx on public.clubs (user_id);
create index if not exists clubs_user_updated_idx on public.clubs (user_id, updated_at desc);

create table if not exists public.club_players (
  id             uuid primary key default gen_random_uuid(),
  club_id        uuid not null references public.clubs(id) on delete cascade,
  name           text not null,
  -- Set when a real account claims this player. Unused until claiming ships.
  user_id        text references public."user"(id) on delete set null,
  last_played_at timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists club_players_club_id_idx on public.club_players (club_id);
-- Names are unique per club, case-insensitively.
create unique index if not exists club_players_club_name_key
  on public.club_players (club_id, lower(name));

alter table public.clubs        enable row level security;
alter table public.club_players enable row level security;
