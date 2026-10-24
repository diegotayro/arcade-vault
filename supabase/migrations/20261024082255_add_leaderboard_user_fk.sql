alter table public.leaderboard
  add constraint leaderboard_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;
