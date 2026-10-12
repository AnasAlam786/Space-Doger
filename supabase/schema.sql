create table if not exists public.leaderboard (
  username text not null,
  highscore integer not null default 0 check (highscore >= 0),
  date timestamptz not null default now(),
  isactive boolean not null default true,
  constraint leaderboard_username_format check (username ~ '^[A-Za-z0-9_]{3,16}$')
);

create unique index if not exists leaderboard_username_lower_unique
  on public.leaderboard (lower(username));

alter table public.leaderboard enable row level security;

grant select, insert, update on public.leaderboard to anon;

drop policy if exists "Anyone can read leaderboard players" on public.leaderboard;
create policy "Anyone can read leaderboard players"
  on public.leaderboard for select to anon
  using (true);

drop policy if exists "Anyone can create leaderboard players" on public.leaderboard;
create policy "Anyone can create leaderboard players"
  on public.leaderboard for insert to anon
  with check (isactive = true);

drop policy if exists "Anyone can update leaderboard scores" on public.leaderboard;
create policy "Anyone can update leaderboard scores"
  on public.leaderboard for update to anon
  using (isactive = true)
  with check (isactive = true);
