-- 1단계 보안: RLS 재작성 · 정산정보 분리(payout_profiles, 주민번호 암호화) · 비공개 Storage
-- 새 코드(phase1-security) 배포와 함께 적용. 전체가 한 트랜잭션으로 실행됨.

begin;

-- ───────────────── 공통 헬퍼 ─────────────────
create or replace function public.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

-- ───────────────── 기존 전체허용 정책 제거 ─────────────────
drop policy if exists "allow all" on public.users;
drop policy if exists "allow all" on public.campaigns;
drop policy if exists "allow all" on public.participations;
drop policy if exists "allow all" on public.agencies;
drop policy if exists "allow all" on public.agency_influencers;
drop policy if exists "clients_admin_only" on public.clients;
drop policy if exists "campaign_requests_admin" on public.campaign_requests;
drop policy if exists "requests_self" on public.campaign_requests;
drop policy if exists "Allow select for authenticated" on public.consultations;
drop policy if exists "Allow insert for all" on public.consultations;
drop policy if exists "allow all" on storage.objects;

-- ───────────────── users ─────────────────
create policy users_select on public.users for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy users_update on public.users for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy users_admin_write on public.users for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 본인이 role을 바꾸거나 admin을 만들 수 없음
create or replace function public.guard_user_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_admin() or auth.uid() is null then return new; end if; -- auth.uid() null = 서버/대시보드
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    raise exception '역할은 변경할 수 없습니다.';
  end if;
  return new;
end $$;
create trigger guard_user_role before update on public.users
  for each row execute function public.guard_user_role();

-- 가입 시 public.users(+clients) 행을 서버에서 생성 (브라우저가 role을 직접 쓰지 않도록)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}');
  r text := case when m->>'role' = 'client' then 'client' else 'influencer' end;
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
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────── clients / agencies ─────────────────
create policy clients_select on public.clients for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy clients_update on public.clients for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy clients_admin on public.clients for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy agencies_admin on public.agencies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy agency_influencers_admin on public.agency_influencers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────────── campaign_requests ─────────────────
create policy requests_select on public.campaign_requests for select to authenticated
  using (client_id = auth.uid() or public.is_admin());
create policy requests_insert on public.campaign_requests for insert to authenticated
  with check (client_id = auth.uid() and status = '검토중' and campaign_id is null and rejection_reason is null);
create policy requests_admin on public.campaign_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────────── campaigns ─────────────────
-- 인플루언서는 캠페인 목록 조회, 고객사는 본인 캠페인만
create policy campaigns_select on public.campaigns for select to authenticated
  using (public.is_admin() or client_id = auth.uid() or public.my_role() = 'influencer');
create policy campaigns_admin on public.campaigns for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────────── participations ─────────────────
create policy participations_select on public.participations for select to authenticated
  using (
    influencer_id = auth.uid() or public.is_admin()
    or exists (select 1 from public.campaigns c where c.id = campaign_id and c.client_id = auth.uid())
  );
create policy participations_insert on public.participations for insert to authenticated
  with check (influencer_id = auth.uid() and status = '신청' and submit_data is null);
create policy participations_update on public.participations for update to authenticated
  using (
    influencer_id = auth.uid() or public.is_admin()
    or exists (select 1 from public.campaigns c where c.id = campaign_id and c.client_id = auth.uid())
  );
create policy participations_admin_delete on public.participations for delete to authenticated
  using (public.is_admin());

-- 역할별 허용 전환만 통과 (3단계에서 전용 함수로 확장 예정)
create or replace function public.guard_participation_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  is_client boolean := exists (select 1 from public.campaigns c where c.id = old.campaign_id and c.client_id = auth.uid());
begin
  if auth.uid() is null or public.is_admin() then return new; end if;

  -- 공통: 누구도 바꿀 수 없는 필드
  if (new.campaign_id, new.influencer_id, new.follower_count, new.fee, new.apply_data, new.memo,
      new.payment_status, new.upload_confirmed, new.address, new.phone)
     is distinct from
     (old.campaign_id, old.influencer_id, old.follower_count, old.fee, old.apply_data, old.memo,
      old.payment_status, old.upload_confirmed, old.address, old.phone) then
    raise exception '변경할 수 없는 항목입니다.';
  end if;

  if old.influencer_id = auth.uid() then
    if new.tracking_number is distinct from old.tracking_number then raise exception '권한이 없습니다.'; end if;
    -- 콘텐츠 제출: 제품발송 → 콘텐츠확인
    if new.status is distinct from old.status then
      if not (old.status = '제품발송' and new.status = '콘텐츠확인') then raise exception '허용되지 않는 상태 변경입니다.'; end if;
    elsif (new.submit_data, new.upload_link) is distinct from (old.submit_data, old.upload_link) then
      raise exception '콘텐츠는 제품발송 단계에서만 제출할 수 있습니다.';
    end if;
    -- 정산요청: 업로드확인 이후 + 정산정보 완료 시에만
    if (new.payment_request_status, new.payment_request_at) is distinct from (old.payment_request_status, old.payment_request_at) then
      if old.status <> '업로드확인' or new.payment_request_status <> '신청' then raise exception '정산 요청할 수 없는 상태입니다.'; end if;
      if not exists (select 1 from public.payout_profiles p where p.user_id = auth.uid()
                     and p.bank_name is not null and p.account_number is not null and p.resident_number_enc is not null) then
        raise exception '정산 정보를 먼저 입력해주세요.';
      end if;
    end if;
    return new;
  end if;

  if is_client then
    -- 고객사: 승인 → 제품발송, 송장번호만
    if (new.submit_data, new.upload_link, new.payment_request_status, new.payment_request_at)
       is distinct from (old.submit_data, old.upload_link, old.payment_request_status, old.payment_request_at) then
      raise exception '권한이 없습니다.';
    end if;
    if new.status is distinct from old.status and not (old.status = '승인' and new.status = '제품발송') then
      raise exception '허용되지 않는 상태 변경입니다.';
    end if;
    return new;
  end if;

  raise exception '권한이 없습니다.';
end $$;
create trigger guard_participation_update before update on public.participations
  for each row execute function public.guard_participation_update();

-- ───────────────── consultations ─────────────────
create policy consultations_insert on public.consultations for insert to anon, authenticated
  with check (true);
create policy consultations_admin on public.consultations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────────── payout_profiles (정산 정보 단일 저장소) ─────────────────
create table public.payout_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  bank_name text,
  account_number text,
  account_holder text,
  resident_number_enc bytea,           -- pgp_sym_encrypt, 키는 Vault 'payout_rrn_key'
  bank_book_path text,
  id_card_path text,
  verified boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.payout_profiles enable row level security;
create policy payout_select on public.payout_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy payout_admin_update on public.payout_profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- 암호문 컬럼은 API로 노출하지 않음 (복호화는 아래 함수로만)
revoke all on public.payout_profiles from anon, authenticated;
grant select (user_id, bank_name, account_number, account_holder, bank_book_path, id_card_path, verified, updated_at)
  on public.payout_profiles to authenticated;
grant update (verified) on public.payout_profiles to authenticated;  -- 관리자 확인 체크 (정책으로 관리자만)

-- 암호화 키 (DB 내 Vault에 저장)
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'payout_rrn_key', '주민번호 암호화 키')
where not exists (select 1 from vault.secrets where name = 'payout_rrn_key');

create or replace function public.payout_key() returns text
language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'payout_rrn_key'
$$;
revoke execute on function public.payout_key() from public, anon, authenticated;

-- 본인 정산정보 저장 (주민번호는 서버에서 암호화, null이면 기존 값 유지)
create or replace function public.save_payout_profile(
  p_bank_name text, p_account_number text, p_account_holder text,
  p_resident_number text default null, p_bank_book_path text default null, p_id_card_path text default null
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if p_resident_number is not null and p_resident_number !~ '^\d{6}-?\d{7}$' then
    raise exception '주민등록번호 형식이 올바르지 않습니다.';
  end if;
  insert into public.payout_profiles as pp (user_id, bank_name, account_number, account_holder, resident_number_enc, bank_book_path, id_card_path)
  values (auth.uid(), p_bank_name, p_account_number, p_account_holder,
          case when p_resident_number is not null then extensions.pgp_sym_encrypt(p_resident_number, public.payout_key()) end,
          p_bank_book_path, p_id_card_path)
  on conflict (user_id) do update set
    bank_name = excluded.bank_name,
    account_number = excluded.account_number,
    account_holder = excluded.account_holder,
    resident_number_enc = coalesce(excluded.resident_number_enc, pp.resident_number_enc),
    bank_book_path = coalesce(excluded.bank_book_path, pp.bank_book_path),
    id_card_path = coalesce(excluded.id_card_path, pp.id_card_path),
    verified = false,
    updated_at = now();
end $$;
revoke execute on function public.save_payout_profile(text, text, text, text, text, text) from public, anon;
grant execute on function public.save_payout_profile(text, text, text, text, text, text) to authenticated;

-- 주민번호 입력 여부 (값 노출 없이)
create or replace function public.payout_has_resident_number() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.payout_profiles where user_id = auth.uid() and resident_number_enc is not null)
$$;

-- 계약서 데이터: 관리자 또는 본인만, 주민번호 복호화
create or replace function public.get_contract_data(p_participation_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare res jsonb;
begin
  select jsonb_build_object(
    'name', coalesce(u.name, p.apply_data->>'name'),
    'address', coalesce(u.address, p.apply_data->>'address'),
    'phone', coalesce(u.phone, p.apply_data->>'phone'),
    'reward', p.apply_data->>'reward',
    'bank_name', pp.bank_name,
    'bank_account', pp.account_number,
    'account_holder', pp.account_holder,
    'resident_number', case when pp.resident_number_enc is not null
                            then extensions.pgp_sym_decrypt(pp.resident_number_enc, public.payout_key()) end
  ) into res
  from public.participations p
  join public.users u on u.id = p.influencer_id
  left join public.payout_profiles pp on pp.user_id = p.influencer_id
  where p.id = p_participation_id and (p.influencer_id = auth.uid() or public.is_admin());
  return res;
end $$;
revoke execute on function public.get_contract_data(uuid) from public, anon;
grant execute on function public.get_contract_data(uuid) to authenticated;

-- ───────────────── 기존 평문 정산정보 이전 ─────────────────
insert into public.payout_profiles (user_id, bank_name, account_number, account_holder, resident_number_enc, bank_book_path, id_card_path)
select id, nullif(bank_name, ''), nullif(account_number, ''), nullif(account_holder, ''),
       case when coalesce(resident_number, '') <> '' then extensions.pgp_sym_encrypt(resident_number, public.payout_key()) end,
       nullif(bank_book_url, ''), nullif(id_card_url, '')
from public.users
where coalesce(bank_name, account_number, account_holder, resident_number, bank_book_url, id_card_url, '') <> '';

-- 신청서(apply_data)에서 민감정보 제거
update public.participations
set apply_data = apply_data - array['bank_name','account_number','account_holder','resident_number','id_card_url','bank_book_url','bank_account']
where apply_data ?| array['bank_name','account_number','account_holder','resident_number','id_card_url','bank_book_url','bank_account'];

-- users의 평문 컬럼 비우기 (컬럼 삭제는 새 코드 배포 확인 후 20260926000002에서)
update public.users set resident_number = null, account_number = null, bank_name = null,
  account_holder = null, id_card_url = null, bank_book_url = null
where coalesce(resident_number, account_number, bank_name, account_holder, id_card_url, bank_book_url) is not null;

-- agency_influencers.bank_info: 데이터가 있으면 멈춤 (손실 방지)
do $$ begin
  if exists (select 1 from public.agency_influencers where coalesce(bank_info, '') <> '') then
    raise exception 'agency_influencers.bank_info에 데이터가 있습니다. 확인 후 다시 실행하세요.';
  end if;
end $$;
alter table public.agency_influencers drop column bank_info;

-- ───────────────── Storage: 비공개 + 폴더 단위 권한 ─────────────────
update storage.buckets set public = false where id in ('influencer-files', 'documents');

-- 새 업로드 경로: influencer-files/{auth.uid()}/...
create policy files_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'influencer-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy files_select on storage.objects for select to authenticated
  using (
    bucket_id = 'influencer-files' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      -- 고객사: 본인 캠페인에 제출된 콘텐츠 파일만
      or exists (
        select 1 from public.participations p join public.campaigns c on c.id = p.campaign_id
        where c.client_id = auth.uid()
          and objects.name in (p.submit_data->>'clean_file_url', p.submit_data->>'final_file_url')
      )
    )
  );
create policy files_modify_own on storage.objects for update to authenticated
  using (bucket_id = 'influencer-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy files_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'influencer-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy documents_admin on storage.objects for all to authenticated
  using (bucket_id = 'documents' and public.is_admin()) with check (bucket_id = 'documents' and public.is_admin());

commit;
