import { getRequestUser } from '../../../lib/supabaseServer'

// 관리자 전용: 캠페인 자동화(Apps Script 사본) 주소. 주소 자체가 실행 권한이라 브라우저 코드에 넣지 않고 서버 환경변수로만 보관
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { client, user } = await getRequestUser(req)
  if (!user) return res.status(401).json({ error: '로그인이 필요합니다.' })
  const { data: me } = await client.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return res.status(403).json({ error: '관리자만 볼 수 있습니다.' })
  if (!process.env.AUTOMATION_APP_URL) return res.status(404).json({ error: '자동화 주소가 아직 설정되지 않았습니다.' })
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ url: process.env.AUTOMATION_APP_URL })
}
