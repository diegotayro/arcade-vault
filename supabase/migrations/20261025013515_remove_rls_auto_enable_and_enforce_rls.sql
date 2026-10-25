drop event trigger if exists ensure_rls;
drop function if exists public.rls_auto_enable();

alter table public.games enable row level security;
alter table public.leaderboard enable row level security;
