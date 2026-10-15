-- Harden Security Definer Functions & Optimize Auth InitPlan

-- 1. Revoke public/anon/authenticated execution on trigger functions so they cannot be invoked via PostgREST RPC
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.check_profile_role_guard() from public, anon, authenticated;
revoke execute on function public.handle_updated_at() from public, anon, authenticated;

-- 2. Restrict is_admin() to authenticated users only (not anonymous)
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 3. Optimize Profiles RLS with subquery initplan: (select auth.uid())
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));
