-- Shared player identity ("Ship 2"). Until now a saved player was a name scoped
-- to ONE club (public.club_players.name), so "Asad" in two clubs was two
-- unrelated rows. This introduces public.people — one identity per human, owned
-- by the account and shared across all its clubs — and turns club_players into a
-- pure membership (this person plays for this club).
--
-- After this, adding "Asad" to a second club reuses the same person instead of
-- duplicating them; renaming a person applies everywhere.
--
-- The runner wraps each migration in a transaction, so no explicit BEGIN/COMMIT.

create table if not exists public.people (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references public."user"(id) on delete cascade,
  name       text not null,
  -- Set when a real account claims this person. Reserved for future claiming.
  claimed_by text references public."user"(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists people_user_id_idx on public.people (user_id);
-- One identity per name per account (case-insensitive) — the dedup key.
create unique index if not exists people_user_name_key
  on public.people (user_id, lower(name));

-- Membership link (nullable while we backfill).
alter table public.club_players
  add column if not exists person_id uuid references public.people(id) on delete cascade;

-- Backfill: one person per distinct (owner, name), then point memberships at it.
insert into public.people (user_id, name)
select distinct c.user_id, cp.name
  from public.club_players cp
  join public.clubs c on c.id = cp.club_id
on conflict (user_id, lower(name)) do nothing;

update public.club_players cp
   set person_id = p.id
  from public.clubs c, public.people p
 where cp.club_id = c.id
   and p.user_id = c.user_id
   and lower(p.name) = lower(cp.name);

-- Enforce the new shape and retire the per-club name/user_id columns.
alter table public.club_players alter column person_id set not null;
drop index if exists club_players_club_name_key;
create unique index if not exists club_players_club_person_key
  on public.club_players (club_id, person_id);
alter table public.club_players drop column if exists name;
alter table public.club_players drop column if exists user_id;
