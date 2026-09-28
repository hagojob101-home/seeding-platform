-- 광고주는 관리자 초대로만 생성: 가입 메타데이터의 role='client'는 초대된 계정(invited_at 있음)일 때만 인정
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}');
  r text := case when m->>'role' = 'client' and new.invited_at is not null then 'client' else 'influencer' end;
begin
  insert into public.users (id, email, name, role, phone, instagram, youtube)
  values (new.id, new.email, coalesce(nullif(m->>'name', ''), split_part(new.email, '@', 1)), r,
          m->>'phone', m->>'instagram', m->>'youtube')
  on conflict (id) do nothing;
  if r = 'client' then
    insert into public.clients (user_id, email, company_name, homepage)
    values (new.id, new.email, m->>'company_name', m->>'homepage');
  end if;
  return new;
end $$;

-- 관리자 광고주 목록의 '초대됨/사용 중' 표시용 (관리자가 아니면 빈 결과)
create or replace function public.client_account_status()
returns table (user_id uuid, last_sign_in_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select u.id, u.last_sign_in_at
  from auth.users u join public.clients c on c.user_id = u.id
  where public.is_admin()
$$;
revoke all on function public.client_account_status() from public, anon;
grant execute on function public.client_account_status() to authenticated;
