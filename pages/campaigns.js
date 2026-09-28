import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Campaigns() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/influencer/login'); return }
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', '진행')
        .order('created_at', { ascending: false })
      setCampaigns(data || [])
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-highlight ">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-ink">캠페인 목록</h1>
        <button onClick={() => router.push('/influencer/dashboard')} className="text-sm text-muted hover:text-ink">← 대시보드</button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-sm text-muted mb-6">참여하고 싶은 캠페인을 선택해주세요!</p>

        <div className="grid gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow p-6 hover:shadow-sm transition cursor-pointer" onClick={() => router.push('/influencer/apply?campaign_id=' + c.id)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-ink text-lg">{c.name}</h3>
                  <p className="text-sm text-muted">{c.product_name}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${c.form_type === 'liquor' ? 'bg-highlight text-ink' : 'bg-highlight text-ink'}`}>
                  {c.form_type === 'liquor' ? '주류' : '일반'}
                </span>
              </div>

              {c.description && <p className="text-sm text-muted mb-3">{c.description}</p>}

              <div className="bg-highlight rounded-xl p-4 mb-3">
                <p className="text-xs font-semibold text-ink mb-3">원고료 기준</p>
                <div className="flex gap-3 text-sm">
                  <div className="flex-1 bg-white rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-muted mb-1">1만 미만</p>
                    <p className="font-bold text-ink">5만원</p>
                  </div>
                  <div className="flex-1 bg-white rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-muted mb-1">1만~3만</p>
                    <p className="font-bold text-ink">15만원</p>
                  </div>
                  <div className="flex-1 bg-white rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-muted mb-1">3만 이상</p>
                    <p className="font-bold text-ink">30만원</p>
                  </div>
                </div>
              </div>

              {c.deadline && <p className="text-xs text-muted mt-2">마감일: {c.deadline}</p>}

              <div className="mt-4">
                <button className="w-full bg-ink text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">
                  신청하기 →
                </button>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div className="text-center py-20 text-muted">
              <p>현재 진행 중인 캠페인이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
