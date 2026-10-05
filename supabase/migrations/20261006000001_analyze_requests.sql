-- 랜딩 '무료 분석' 요청 기록 + IP별 호출 제한 (IP는 솔트 SHA-256 해시만 저장)
-- 정책 없음: service role(서버 API)만 읽고 쓴다
create table public.analyze_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ip_hash text not null,
  country text not null,
  host text not null,
  title text,
  matched_keyword text
);
create index on public.analyze_requests (ip_hash, created_at);
alter table public.analyze_requests enable row level security;
