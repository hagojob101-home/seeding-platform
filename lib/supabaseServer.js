import { createClient } from '@supabase/supabase-js'

// 요청자의 JWT로 Supabase 클라이언트 생성 → RLS가 요청자 권한으로 적용됨
export async function getRequestUser(req) {
  const token = req.headers.authorization?.replace(/^Bearer /, '')
  if (!token) return {}
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
  const { data: { user } } = await client.auth.getUser(token)
  return user ? { client, user } : {}
}
