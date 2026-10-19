create table public.games (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  short text not null,
  long text not null,
  category text not null check (category in ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS')),
  cover text not null,
  color text not null check (color in ('cyan', 'magenta', 'yellow', 'green')),
  plays_count integer not null default 0 check (plays_count >= 0),
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "games are publicly readable" on public.games
  for select to anon, authenticated using (true);

insert into public.games (id, title, short, long, category, cover, color)
values (
  'asteroids',
  'ASTEROIDES',
  'Esquiva, dispara y fragmenta rocas en el vacío.',
  'Gira, propulsa y dispara para partir asteroides en fragmentos cada vez más pequeños. Recoge el power-up de triple disparo y sobrevive a oleadas que no paran de crecer.',
  'SHOOTER',
  'cover-asteroids',
  'cyan'
);
