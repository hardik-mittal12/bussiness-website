-- Fix is_admin() Execution Permission for RLS Policies
-- When anonymous visitors query tables whose RLS policy checks `is_admin()`, Postgres requires execute privilege on is_admin().
-- The function returns false immediately if auth.uid() is null.

create or replace function public.is_admin()
returns boolean
security definer
set search_path = public
language plpgsql as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$;

grant execute on function public.is_admin() to anon, authenticated;
