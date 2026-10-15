-- Auth to Profile Sync & Secure Role Bootstrap Guard

-- 1. Sync new auth.users to public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    'viewer',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Hardened Role Guard: Blocks user self-promotion while allowing database administrator provisioning
create or replace function public.check_profile_role_guard()
returns trigger as $$
begin
  -- When invoked via an authenticated HTTP client session (auth.uid() is not null)
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      if new.role = 'admin' and not public.is_admin() then
        raise exception 'Unauthorized admin role creation';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.role is distinct from old.role and not public.is_admin() then
        raise exception 'Unauthorized role modification';
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_check_profile_role on public.profiles;
create trigger tr_check_profile_role
  before insert or update on public.profiles
  for each row execute function public.check_profile_role_guard();
