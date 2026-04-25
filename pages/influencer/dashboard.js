import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function InfluencerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/influencer/login'); return }
      setUser(user)
      const { data } = await supabase
        .from('participations')
        .select('*, campaigns(*)')
        .eq('influencer_id', user.id)
        .order('created_at', { ascending: false })
      setParticipations(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleDownloadContract = async (participationId) => {
    setDownloadingId(participationId)
    try {
      const res = await fetch('/api/generate-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participation_id: participationId }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert('오류: ' + err.error)
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '계약서.pdf'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('다운로드 오류: ' + err.message)
    }
    setDownloadingId(null)
  }

  const statusColor = (status) => {
    const map = {
      '신청': 'bg-yellow-100 text-yellow-700',
      '승인': 'bg-blue-100 text-blue-700',
      '제품발송': 'bg-purple-100 text-purple-700',
      '콘텐츠확인': 'bg-orange-100 text-orange-700',
      '완료': 'bg-green-100 text-green-700',
      '거절': 'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-700">인플루언서 대시보드</h1>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/influencer/login') }} className="text-sm text-gray-500 hover:text-red-500">로그아웃</button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">안녕하세요! 👋</h2>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">참여 중인 캠페인</h2>
          <button onClick={() => router.push('/campaigns')} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
            + 캠페인 신청하기
          </button>
        </div>

        {participations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <p className="text-gray-400 mb-4">아직 참여 중인 캠페인이 없습니다.</p>
            <button onClick={() => router.push('/campaigns')} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition">
              캠페인 둘러보기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {participations.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{p.campaigns?.name || '-'}</h3>
                    <p className="text-sm text-gray-500">{p.campaigns?.product_name || ''}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <span>리워드: {p.campaigns?.reward || '-'}</span>
                  <span>·</span>
                  <span className={`font-semibold ${p.payment_status === '지급완료' ? 'text-green-600' : 'text-gray-400'}`}>
                    {p.payment_status === '지급완료' ? '✅ 정산완료' : '⏳ 정산대기'}
                  </span>
                </div>

                <div className="flex gap-3 flex-wrap">
                  {p.status === '승인' && (
                    <button
                      onClick={() => handleDownloadContract(p.id)}
                      disabled={downloadingId === p.id}
                      className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
                    >
                      {downloadingId === p.id ? '생성 중...' : '📄 계약서 다운로드'}
                    </button>
                  )}
                  {(p.status === '승인' || p.status === '제품발송' || p.status === '콘텐츠확인') && (
                    <button
                      onClick={() => router.push('/influencer/submit?participation_id=' + p.id)}
                      className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-600 transition"
                    >
                      📤 콘텐츠 제출
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
