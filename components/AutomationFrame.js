import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// 관리자 '캠페인 자동화' 탭: Apps Script 사본을 화면 안에 띄움 (주소는 관리자 확인 후 서버에서 받음)
export default function AutomationFrame() {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/automation-url', { headers: { Authorization: `Bearer ${session?.access_token}` } })
      const body = await res.json().catch(() => ({}))
      res.ok ? setUrl(body.url) : setError(body.error || '자동화 화면을 불러오지 못했습니다.')
    })()
  }, [])

  if (error) return <p role="alert" className="text-sm text-muted py-10 text-center">{error}</p>
  if (!url) return <p className="text-sm text-muted py-10 text-center">불러오는 중...</p>
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-ink">캠페인 자동화</h2>
        <a href={url} target="_blank" rel="noreferrer" className="text-sm text-muted underline hover:text-ink">새 창에서 열기</a>
      </div>
      <iframe src={url} title="인플루언서 캠페인 자동화" className="w-full rounded-2xl border border-line bg-white" style={{ height: '1400px' }} />
    </div>
  )
}
