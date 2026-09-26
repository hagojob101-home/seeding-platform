-- 새 코드 배포 후 정상 동작 확인되면 적용: users의 평문 정산 컬럼 삭제
alter table public.users
  drop column resident_number, drop column account_number, drop column bank_name,
  drop column account_holder, drop column id_card_url, drop column bank_book_url;
