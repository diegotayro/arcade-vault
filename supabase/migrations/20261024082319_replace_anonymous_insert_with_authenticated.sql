drop policy "temporary anonymous insert for ported games" on public.leaderboard;
create policy "authenticated insert own score" on public.leaderboard
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and game_id in ('asteroids', 'tetris', 'arkanoid', 'snake', 'frogger')
  );
