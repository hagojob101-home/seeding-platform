-- 2단계 데이터 구조 통합
--  · clients + agencies → clients (user_id 선택)
--  · agency_influencers → client_influencers (client_id)
--  · campaign_requests + campaigns → campaigns (status: 요청/진행/완료/거절, client_id → clients.id)
--  · participations: status 하나로 (payment_status·payment_request_status 제거)
--  · apply_data: 캠페인별 답변만 (개인정보는 users, 서류는 payout_profiles)
-- 전체 한 트랜잭션. 중간 오류 시 전부 취소됨.

begin;

-- ───────────────── 1. 고객사 통합 ─────────────────
alter table public.clients
  add column if not exists industry text,
  add column if not exists start_date date,
  add column if not exists memo text;

create temp table agency_map (agency_id uuid primary key, client_id uuid not null) on commit drop;

-- 같은 회사명(대소문자·공백 무시)이 있으면 그 고객사에 합치고, 없으면 계정 없는 고객사로 추가
insert into agency_map
select a.id, c.id
from public.agencies a
join lateral (
  select id from public.clients c
  where lower(trim(c.company_name)) = lower(trim(a.company_name))
  order by c.created_at limit 1
) c on true;

update public.clients c set
  industry = coalesce(c.industry, a.industry),
  start_date = coalesce(c.start_date, a.start_date),
  memo = coalesce(c.memo, a.memo)
from agency_map m join public.agencies a on a.id = m.agency_id
where c.id = m.client_id;

with ins as (
  insert into public.clients (company_name, industry, start_date, memo, created_at)
  select a.company_name, a.industry, a.start_date, a.memo, a.created_at
  from public.agencies a
  where not exists (select 1 from agency_map m where m.agency_id = a.id)
  returning id, company_name, created_at
)
insert into agency_map
select a.id, ins.id from public.agencies a
join ins on ins.company_name = a.company_name and ins.created_at = a.created_at
where not exists (select 1 from agency_map m where m.agency_id = a.id);

-- ───────────────── 2. 고객사별 인플루언서 이력 ─────────────────
alter table public.agency_influencers rename to client_influencers;
alter table public.client_influencers add column client_id uuid references public.clients(id) on delete cascade;
update public.client_influencers ci set client_id = m.client_id from agency_map m where m.agency_id = ci.agency_id;
alter table public.client_influencers drop column agency_id;
alter policy agency_influencers_admin on public.client_influencers rename to client_influencers_admin;
-- bank_info는 계정 없는 인플루언서 정보라 유지 (관리자 전용 RLS)

drop policy if exists agencies_admin on public.agencies;
drop table public.agencies;

-- 이 캠페인의 고객사 계정이 나인가
create or replace function public.owns_campaign(p_campaign_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.campaigns cp join public.clients c on c.id = cp.client_id
    where cp.id = p_campaign_id and c.user_id = auth.uid()
  )
$$;

-- ───────────────── 3. 캠페인 통합 ─────────────────
alter table public.campaigns
  add column if not exists monthly_budget integer,
  add column if not exists product_url text,
  add column if not exists product_price integer,
  add column if not exists min_influencers integer,
  add column if not exists rejection_reason text;

-- client_id: auth 사용자 id → clients.id
alter table public.campaigns drop constraint if exists campaigns_client_id_fkey;
update public.campaigns cp set client_id = c.id
from public.clients c where c.user_id = cp.client_id;
update public.campaigns set client_id = null
where client_id is not null and not exists (select 1 from public.clients c where c.id = client_id);
alter table public.campaigns add constraint campaigns_client_id_fkey
  foreign key (client_id) references public.clients(id) on delete set null;

-- 승인된 요청 → 연결된 캠페인에 요청 정보 합치기
update public.campaigns cp set
  monthly_budget = r.monthly_budget,
  product_url = r.product_url,
  product_price = r.product_price,
  min_influencers = r.min_influencers,
  client_id = coalesce(cp.client_id, c.id)
from public.campaign_requests r
left join public.clients c on c.user_id = r.client_id
where r.campaign_id = cp.id;

-- 캠페인으로 안 넘어간 요청(검토중·거절) → 캠페인(요청·거절)으로
insert into public.campaigns (client_id, name, product_name, description, status, form_type,
                              monthly_budget, product_url, product_price, min_influencers, rejection_reason, created_at)
select c.id, coalesce(r.product_name, '제품') || ' 캠페인', coalesce(r.product_name, '제품'), r.company_name || ' 시딩 캠페인',
       case when r.status = '거절' then '거절' else '요청' end, 'basic',
       r.monthly_budget, r.product_url, r.product_price, r.min_influencers, r.rejection_reason, r.created_at
from public.campaign_requests r
left join public.clients c on c.user_id = r.client_id
where r.campaign_id is null;

-- 기존 캠페인 상태: 모집중 등 → 진행 (비활성은 완료)
update public.campaigns set status = case when is_active = false then '완료' else '진행' end
where status not in ('요청', '진행', '완료', '거절');
alter table public.campaigns alter column status set default '요청';
alter table public.campaigns add constraint campaigns_status_check check (status in ('요청', '진행', '완료', '거절'));
alter table public.campaigns drop column campaign_request_id;
alter table public.campaigns drop column is_active;

drop policy if exists requests_select on public.campaign_requests;
drop policy if exists requests_insert on public.campaign_requests;
drop policy if exists requests_admin on public.campaign_requests;
drop table public.campaign_requests;

-- 캠페인 정책: 고객사는 본인 캠페인, 인플루언서는 진행 중인 캠페인만
drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select on public.campaigns for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())
    or (public.my_role() = 'influencer' and status = '진행')
  );
-- 고객사 캠페인 요청 = 상태 '요청'으로만 생성
create policy campaigns_client_request on public.campaigns for insert to authenticated
  with check (
    status = '요청' and rejection_reason is null
    and exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())
  );

-- ───────────────── 4. 참여 상태 통합 ─────────────────
update public.participations set status = case
  when payment_status = '지급완료' then '정산완료'
  when payment_request_status = '신청' and status not in ('정산완료', '거절') then '정산요청'
  when status = '완료' then '업로드확인'
  else status end;
update public.participations set status = '신청'
where status not in ('신청','승인','제품발송','콘텐츠확인','업로드확인','정산요청','정산완료','거절');
alter table public.participations add constraint participations_status_check
  check (status in ('신청','승인','제품발송','콘텐츠확인','업로드확인','정산요청','정산완료','거절'));
alter table public.participations drop column payment_status, drop column payment_request_status;

-- ───────────────── 5. apply_data 정리 ─────────────────
-- 신청 기록에만 있던 기본정보는 users로 (비어 있을 때만)
update public.users u set
  phone = coalesce(nullif(u.phone, ''), a.phone),
  address = coalesce(nullif(u.address, ''), a.address),
  instagram = coalesce(nullif(u.instagram, ''), a.instagram),
  youtube = coalesce(nullif(u.youtube, ''), a.youtube)
from (
  select distinct on (influencer_id) influencer_id,
         nullif(apply_data->>'phone', '') phone, nullif(apply_data->>'address', '') address,
         nullif(apply_data->>'instagram', '') instagram, nullif(apply_data->>'youtube', '') youtube
  from public.participations where apply_data is not null
  order by influencer_id, created_at desc
) a
where a.influencer_id = u.id;

-- 신청 기록에 남은 서류 경로(id_file_url·bank_file_url) → payout_profiles (비어 있을 때만)
insert into public.payout_profiles (user_id, id_card_path, bank_book_path)
select distinct on (influencer_id) influencer_id,
       nullif(apply_data->>'id_file_url', ''), nullif(apply_data->>'bank_file_url', '')
from public.participations
where coalesce(apply_data->>'id_file_url', apply_data->>'bank_file_url', '') <> ''
order by influencer_id, created_at desc
on conflict (user_id) do update set
  id_card_path = coalesce(public.payout_profiles.id_card_path, excluded.id_card_path),
  bank_book_path = coalesce(public.payout_profiles.bank_book_path, excluded.bank_book_path);

-- apply_data에는 캠페인별 답변만 남김
update public.participations
set apply_data = apply_data - array['name','phone','address','email','instagram','youtube','id_file_url','bank_file_url']
where apply_data ?| array['name','phone','address','email','instagram','youtube','id_file_url','bank_file_url'];

-- ───────────────── 6. 권한 함수·정책을 새 구조로 ─────────────────
drop policy if exists participations_select on public.participations;
create policy participations_select on public.participations for select to authenticated
  using (influencer_id = auth.uid() or public.is_admin() or public.owns_campaign(campaign_id));
drop policy if exists participations_update on public.participations;
create policy participations_update on public.participations for update to authenticated
  using (influencer_id = auth.uid() or public.is_admin() or public.owns_campaign(campaign_id));
-- 신청은 진행 중인 캠페인에만
drop policy if exists participations_insert on public.participations;
create policy participations_insert on public.participations for insert to authenticated
  with check (
    influencer_id = auth.uid() and status = '신청' and submit_data is null
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.status = '진행')
  );

create or replace function public.guard_participation_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;

  if (new.campaign_id, new.influencer_id, new.follower_count, new.fee, new.apply_data, new.memo,
      new.upload_confirmed, new.address, new.phone)
     is distinct from
     (old.campaign_id, old.influencer_id, old.follower_count, old.fee, old.apply_data, old.memo,
      old.upload_confirmed, old.address, old.phone) then
    raise exception '변경할 수 없는 항목입니다.';
  end if;

  if old.influencer_id = auth.uid() then
    if new.tracking_number is distinct from old.tracking_number then raise exception '권한이 없습니다.'; end if;
    if new.status is distinct from old.status then
      -- 콘텐츠 제출: 제품발송 → 콘텐츠확인 / 정산요청: 업로드확인 → 정산요청 (정산정보 완료 시)
      if old.status = '제품발송' and new.status = '콘텐츠확인' then
        null;
      elsif old.status = '업로드확인' and new.status = '정산요청' then
        if not exists (select 1 from public.payout_profiles p where p.user_id = auth.uid()
                       and p.bank_name is not null and p.account_number is not null and p.resident_number_enc is not null) then
          raise exception '정산 정보를 먼저 입력해주세요.';
        end if;
        new.payment_request_at := now();
      else
        raise exception '허용되지 않는 상태 변경입니다.';
      end if;
    elsif (new.submit_data, new.upload_link, new.payment_request_at)
          is distinct from (old.submit_data, old.upload_link, old.payment_request_at) then
      raise exception '권한이 없습니다.';
    end if;
    return new;
  end if;

  if public.owns_campaign(old.campaign_id) then
    -- 고객사: 승인 → 제품발송, 송장번호만
    if (new.submit_data, new.upload_link, new.payment_request_at)
       is distinct from (old.submit_data, old.upload_link, old.payment_request_at) then
      raise exception '권한이 없습니다.';
    end if;
    if new.status is distinct from old.status and not (old.status = '승인' and new.status = '제품발송') then
      raise exception '허용되지 않는 상태 변경입니다.';
    end if;
    return new;
  end if;

  raise exception '권한이 없습니다.';
end $$;

-- 고객사: 본인 캠페인에 제출된 콘텐츠 파일만 열람
drop policy if exists files_select on storage.objects;
create policy files_select on storage.objects for select to authenticated
  using (
    bucket_id = 'influencer-files' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or exists (
        select 1 from public.participations p
        where public.owns_campaign(p.campaign_id)
          and objects.name in (p.submit_data->>'clean_file_url', p.submit_data->>'final_file_url')
      )
    )
  );

-- 고객사·관리자용 참여자 목록 (배송에 필요한 기본정보 포함, 정산정보 제외)
create or replace function public.campaign_participants(p_campaign_id uuid)
returns table (id uuid, status text, fee integer, follower_count integer, tracking_number text,
               apply_data jsonb, submit_data jsonb, created_at timestamptz,
               name text, phone text, address text, instagram text, youtube text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.status, p.fee, p.follower_count, p.tracking_number, p.apply_data, p.submit_data, p.created_at,
         u.name, u.phone, u.address, u.instagram, u.youtube
  from public.participations p join public.users u on u.id = p.influencer_id
  where p.campaign_id = p_campaign_id and (public.is_admin() or public.owns_campaign(p_campaign_id))
  order by p.created_at desc
$$;
revoke execute on function public.campaign_participants(uuid) from public, anon;
grant execute on function public.campaign_participants(uuid) to authenticated;

-- 계약서: 기본정보는 users에서
create or replace function public.get_contract_data(p_participation_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare res jsonb;
begin
  select jsonb_build_object(
    'name', u.name, 'address', u.address, 'phone', u.phone,
    'reward', p.apply_data->>'reward',
    'bank_name', pp.bank_name, 'bank_account', pp.account_number, 'account_holder', pp.account_holder,
    'resident_number', case when pp.resident_number_enc is not null
                            then extensions.pgp_sym_decrypt(pp.resident_number_enc, public.payout_key()) end
  ) into res
  from public.participations p
  join public.users u on u.id = p.influencer_id
  left join public.payout_profiles pp on pp.user_id = p.influencer_id
  where p.id = p_participation_id and (p.influencer_id = auth.uid() or public.is_admin());
  return res;
end $$;

commit;
