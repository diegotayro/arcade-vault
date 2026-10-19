create view public.games_catalog with (security_invoker = true) as
  select g.*, coalesce(max(l.score), 0) as best
  from public.games g
  left join public.leaderboard l on l.game_id = g.id
  group by g.id;

create function public.top_scores(p_limit int)
returns table (game_id text, rank int, player_name text, score int, created_at timestamptz)
language sql stable security invoker set search_path = ''
as $$
  select ranked.game_id, ranked.rank, ranked.player_name, ranked.score, ranked.created_at
  from (
    select
      l.game_id,
      row_number() over (partition by l.game_id order by l.score desc, l.created_at)::int as rank,
      l.player_name,
      l.score,
      l.created_at
    from public.leaderboard l
  ) ranked
  where ranked.rank <= p_limit
  order by ranked.game_id, ranked.rank;
$$;
