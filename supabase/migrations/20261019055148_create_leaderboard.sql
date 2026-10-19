create table public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  game_id text not null check (game_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  user_id uuid,
  player_name text not null check (char_length(player_name) between 3 and 12),
  score integer not null check (score >= 0 and score <= 10000000),
  created_at timestamptz not null default now()
);

create index leaderboard_game_score_idx on public.leaderboard (game_id, score desc, created_at);

alter table public.leaderboard enable row level security;

create policy "leaderboard is publicly readable" on public.leaderboard
  for select to anon, authenticated using (true);

-- TEMPORAL: inserción anónima solo para asteroides hasta la spec de auth
create policy "temporary anonymous insert for asteroids" on public.leaderboard
  for insert to anon, authenticated
  with check (game_id = 'asteroids' and user_id is null);
