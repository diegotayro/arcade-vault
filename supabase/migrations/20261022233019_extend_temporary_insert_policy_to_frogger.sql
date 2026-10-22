drop policy "temporary anonymous insert for ported games" on public.leaderboard;

create policy "temporary anonymous insert for ported games" on public.leaderboard
  for insert to anon, authenticated
  with check (game_id in ('asteroids', 'tetris', 'arkanoid', 'snake', 'frogger') and user_id is null);
