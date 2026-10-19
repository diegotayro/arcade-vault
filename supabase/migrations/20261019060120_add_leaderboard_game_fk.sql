alter table public.leaderboard drop constraint leaderboard_game_id_check;

alter table public.leaderboard
  add constraint leaderboard_game_id_fkey
  foreign key (game_id) references public.games (id);
