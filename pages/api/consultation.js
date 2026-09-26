import { supabase } from '../../lib/supabase'

const LIMITS = { manager_name: 50, job_title: 50, phone_number: 20, sns_url: 300, website_url: 300, inquiry_message: 2000 }
const REQUIRED = ['manager_name', 'job_title', 'phone_number', 'inquiry_message']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const body = req.body || {}
  // 허니팟: 사람에게 안 보이는 필드가 채워졌으면 봇 → 성공인 척 응답
  if (body.company_fax) return res.status(200).json({ success: true })

  const data = {}
  for (const [key, max] of Object.entries(LIMITS)) {
    const v = typeof body[key] === 'string' ? body[key].trim() : ''
    if (v.length > max) return res.status(400).json({ error: '입력값이 너무 깁니다.' })
    data[key] = v || null
  }
  if (REQUIRED.some(k => !data[k])) return res.status(400).json({ error: '필수 항목을 입력해주세요.' })
  if (!/^[0-9+\-\s()]{8,20}$/.test(data.phone_number)) return res.status(400).json({ error: '전화번호 형식이 올바르지 않습니다.' })

  const { error } = await supabase.from('consultations').insert(data)
  if (error) { console.error(error); return res.status(500).json({ error: '접수 중 오류가 발생했습니다.' }) }
  return res.status(200).json({ success: true })
}
