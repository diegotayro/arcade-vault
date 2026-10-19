create function public.health_check()
returns text
language sql
security invoker
set search_path = ''
as $$ select 'ok'::text $$;

revoke execute on function public.health_check() from public;
grant execute on function public.health_check() to anon, authenticated;
