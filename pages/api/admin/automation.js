import { getRequestUser } from '../../../lib/supabaseServer'

// 관리자 전용: 캠페인 자동화(Apps Script 사본, hagojob101로 실행)를 서버끼리 호출
// 주소·키는 서버 환경변수에만 있고 브라우저에는 보내지 않음
const ACTIONS = ['guessBrandName', 'runAutomation', 'listCampaigns', 'getCampaignEmail', 'saveCampaignEmail', 'getSenderOptions', 'sendInviteEmails']

export const config = { maxDuration: 60 } // 캠페인 생성(폴더·폼·가이드)에 수십 초 걸림

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { client, user } = await getRequestUser(req)
  if (!user) return res.status(401).json({ error: '로그인이 필요합니다.' })
  const { data: me } = await client.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return res.status(403).json({ error: '관리자만 사용할 수 있습니다.' })

  const { action, args = [] } = req.body || {}
  if (!ACTIONS.includes(action) || !Array.isArray(args)) return res.status(400).json({ error: '잘못된 요청입니다.' })
  // 붙여넣을 때 섞인 공백·줄바꿈 제거
  const url = (process.env.AUTOMATION_API_URL || '').replace(/\s+/g, '')
  const key = (process.env.AUTOMATION_API_KEY || '').replace(/\s+/g, '')
  if (!url || !key) return res.status(500).json({ error: '자동화 연결 설정이 아직 없습니다.' })

  try {
    // Apps Script는 POST 후 결과 주소로 넘겨줌 → fetch가 따라가서 JSON을 받음
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, args, key }),
    })
    const text = await r.text()
    let out
    try { out = JSON.parse(text) } catch {
      // JSON 대신 구글 오류 페이지가 오면 주소가 틀린 것
      console.error('automation', action, 'non-JSON response', r.status)
      return res.status(502).json({ error: '자동화 주소(AUTOMATION_API_URL)가 올바르지 않습니다. Vercel 설정을 확인해주세요.' })
    }
    if (!out.ok) return res.status(out.error === 'unauthorized' ? 502 : 400).json({ error: out.error === 'unauthorized' ? '자동화 연결 키가 맞지 않습니다.' : out.error })
    res.status(200).json({ data: out.data })
  } catch (e) {
    console.error('automation', action, e.message)
    res.status(502).json({ error: '자동화 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.' })
  }
}
