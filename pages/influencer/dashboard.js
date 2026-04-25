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
      a.download = 'contract.pdf'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('다운로드 오류: ' + err.message)
    }
    setDownloadingId(null)
  }

  const handlePaymentRequest = async (participationId) => {
    const { error } = await supabase.from('participations').update({
      payment_request_status: '신청',
      payment_request_at: new Date().toISOString(),
    }).eq('id', participationId)
    if (error) { alert('오류: ' + error.message); return }
    alert('정산 신청이 완료되었습니다!')
    const { data } = await supabase
      .from('participations')
      .select('*, campaigns(*)')
      .eq('influencer_id', user.id)
      .order('created_at', { ascending: false })
    setParticipations(data || [])
  }

  const formatReward = (p) => {
    const reward = p.apply_data?.reward
    if (reward) return reward
    const r = p.campaigns?.reward
    if (!r) return '-'
    const num = parseInt(String(r).replace(/,/g, ''))
    if (isNaN(num)) return r
    return num.toLocaleString() + '원'
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

  const STEPS = ['신청', '승인', '제품발송', '콘텐츠확인', '완료']
  const stepIcons = ['📋', '✅', '📦', '🎬', '🏆']
  const getStepIndex = (status) => STEPS.indexOf(status)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-700">인플루언서 대시보드</h1>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/influencer/login') }}
          className="text-sm text-gray-500 hover:text-red-500">로그아웃</button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">안녕하세요! 👋</h2>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">참여 중인 캠페인</h2>
          <button onClick={() => router.push('/campaigns')}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
            + 캠페인 신청하기
          </button>
        </div>

        {participations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <p className="text-gray-400 mb-4">아직 참여 중인 캠페인이 없습니다.</p>
            <button onClick={() => router.push('/campaigns')}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition">
              캠페인 둘러보기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {participations.map(p => {
              const stepIdx = getStepIndex(p.status)
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{p.campaigns?.name || '-'}</h3>
                      <p className="text-sm text-gray-500">{p.campaigns?.product_name || ''}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </div>

                  {/* 진행 상황 바 */}
                  <div className="mb-4">
                    <div className="flex items-center">
                      {STEPS.map((step, idx) => (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all ${
                              idx < stepIdx
                                ? 'bg-green-500 border-green-500 text-white'
                                : idx === stepIdx
                                ? 'bg-purple-500 border-purple-500 text-white'
                                : 'bg-white border-gray-200 text-gray-300'
                            }`}>
                              {idx < stepIdx ? '✓' : stepIcons[idx]}
                            </div>
                            <p className={`text-xs mt-1 font-medium whitespace-nowrap ${
                              idx <= stepIdx ? 'text-purple-600' : 'text-gray-300'
                            }`}>{step}</p>
                          </div>
                          {idx < STEPS.length - 1 && (
                            <div className={`h-1 flex-1 mx-1 mb-4 rounded ${
                              idx < stepIdx ? 'bg-green-400' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 원고료 및 정산 상태 */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm text-gray-500">원고료: <span className="font-bold text-purple-700">{formatReward(p)}</span></span>
                    {p.payment_status === '지급완료' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">✅ 정산완료</span>
                    )}
                    {p.payment_request_status === '신청' && p.payment_status !== '지급완료' && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">⏳ 정산신청중</span>
                    )}
                  </div>

                  {/* 버튼 영역 */}
                  <div className="flex gap-3 flex-wrap">
                    {/* 계약서 다운로드 - 승인 상태 */}
                    {p.status === '승인' && (
                      <button onClick={() => handleDownloadContract(p.id)}
                        disabled={downloadingId === p.id}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 transition">
                        {downloadingId === p.id ? '생성 중...' : '📄 계약서 다운로드'}
                      </button>
                    )}

                    {/* 콘텐츠 제출 - 제품발송 상태이고 아직 제출 안 한 경우 */}
                    {(p.status === '제품발송') && !p.submit_data && (
                      <button onClick={() => router.push('/influencer/submit?participation_id=' + p.id)}
                        className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-600 transition">
                        📤 콘텐츠 제출
                      </button>
                    )}

                    {/* 콘텐츠 제출됨 표시 */}
                    {p.submit_data && p.status === '콘텐츠확인' && (
                      <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-sm font-semibold">
                        🎬 콘텐츠 검토중
                      </span>
                    )}

                    {/* 정산 신청 - 완료 상태이고 아직 신청 안 한 경우 */}
                    {p.status === '완료' && p.payment_status !== '지급완료' && p.payment_request_status !== '신청' && (
                      <button onClick={() => handlePaymentRequest(p.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition">
                        💰 정산 신청하기
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
