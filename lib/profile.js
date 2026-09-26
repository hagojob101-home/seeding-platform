import { supabase } from './supabase'

// users + payout_profiles 병합 (주민번호는 값 대신 입력 여부만)
export async function loadInfluencerProfile(userId) {
  const [{ data: user }, { data: payout }, { data: hasRrn }] = await Promise.all([
    supabase.from('users').select('id, email, name, phone, address, instagram, youtube, role').eq('id', userId).single(),
    supabase.from('payout_profiles').select('bank_name, account_number, account_holder, bank_book_path, id_card_path, verified').eq('user_id', userId).maybeSingle(),
    supabase.rpc('payout_has_resident_number'),
  ])
  if (!user) return null
  return {
    ...user,
    bank_name: payout?.bank_name, account_number: payout?.account_number, account_holder: payout?.account_holder,
    id_card_url: payout?.id_card_path, bank_book_url: payout?.bank_book_path, has_resident_number: !!hasRrn,
  }
}
