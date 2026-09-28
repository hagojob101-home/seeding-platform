import { createClient } from '@supabase/supabase-js'
import { getRequestUser } from '../../../lib/supabaseServer'

// 관리자 전용: 광고주 담당자에게 초대 메일 발송 → 가입 트리거가 users·clients 행 생성
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { client, user } = await getRequestUser(req)
  if (!user) return res.status(401).json({ error: '로그인이 필요합니다.' })
  const { data: me } = await client.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return res.status(403).json({ error: '관리자만 초대할 수 있습니다.' })

  const { email, company_name, name, phone, homepage } = req.body || {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || !company_name?.trim()) {
    return res.status(400).json({ error: '회사명과 올바른 이메일을 입력해주세요.' })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const { error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    data: { role: 'client', company_name: company_name.trim(), name: name?.trim(), phone: phone?.trim(), homepage: homepage?.trim() },
    redirectTo: `https://${req.headers.host}/reset-password`,
  })
  if (error) {
    console.error('invite-client', error.message)
    const taken = /already|registered|exists/i.test(error.message)
    return res.status(taken ? 409 : 500).json({ error: taken ? '이미 가입된 이메일입니다.' : '초대 메일 발송에 실패했습니다.' })
  }
  res.status(200).json({ ok: true })
}
