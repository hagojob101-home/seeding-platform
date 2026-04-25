import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientCampaignDetail() {
  const router = useRouter()
  const { id } = router.query
  const [campaign, setCampaign] = useState(null)
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!id) return
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login'); return }
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
      setIsAdmin(userData?.role === 'admin')
      await fetchData()
      setLoading(false)
    }
    init()
  }, [id])

  const fetchData = async () => {
    const { data: c } = await supabase.from('campaigns').select('*').eq('id', id).single()
    setCampaign(c)
    const { data: p } = await supabase
      .from('participations')
      .select('*, users(*)')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })
    setParticipations(p || [])
  }

  const handleShipment = async (participationId) => {
    await supabase.from('participations').update({ status: '제품발송' }).eq('id', participationId)
    await fetchData()
  }

  const handleStatusUpdate = async (pid, status) => {
    await supabase.from('participations').update({ status }).eq('id', pid)
    await fetchData()
  }

  const handlePaymentUpdate = async (pid) => {
    await supabase.from('participations').update({ payment_status: '지급완료' }).eq('id', pid)
    await fetchData()
  }

  const steps = ['신청', '승인', '제품발송', '콘텐츠확인', '완료']
  const stepIcons = ['📋', '✅', '📦', '🎬', '🏆']

  const getStepIndex = (status) => {
    const map = { '신청': 0, '승인': 1, '제품발송': 2, '콘텐츠확인': 3, '완료': 4, '거절': -1 }
    return map[status] ?? 0
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-purple-600">← 뒤로</button>
          <h1 className="text-xl font-bold text-purple-700">{campaign?.name}</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">👥 인플루언서 진행 현황 ({participations.length}명)</h2>
        </div>

        <div className="flex flex-col gap-6">
          {participations.map(p => {
            const currentStep = getStepIndex(p.status)
            const isRejected = p.status === '거절'

            return (
              <div key={p.id} className="bg-white rounded-2xl shadow p-6">
                {/* 인플루언서 정보 */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-gray-800 text-lg">{p.apply_data?.name || p.users?.name || '-'}</p>
                    <p className="text-sm text-gray-500">📱 {p.apply_data?.phone || '-'}</p>
                    <p className="text-sm text-gray-500">📍 {p.apply_data?.address || '-'}</p>
                    <p className="text-sm text-gray-500">📸 {p.apply_data?.instagram || '-'} · 팔로워 {p.apply_data?.followers ? Number(p.apply_data.followers).toLocaleString() : '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600 text-lg">{p.apply_data?.reward || '-'}</p>
                    {isRejected && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">거절</span>}
                  </div>
                </div>

                {/* 진행 상황 바 */}
                {!isRejected && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" />
                      <div
                        className="absolute top-5 left-0 h-1 bg-green-500 z-0 transition-all"
                        style={{ width: currentStep === 0 ? '0%' : `${(currentStep / (steps.length - 1)) * 100}%` }}
                      />
                      {steps.map((label, i) => (
                        <div key={i} className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                            i < currentStep ? 'bg-green-500 text-white' :
                            i === currentStep ? 'bg-green-500 text-white ring-4 ring-green-200' :
                            'bg-gray-200 text-gray-400'
                          }`}>
                            {stepIcons[i]}
                          </div>
                          <p className={`text-xs mt-2 font-semibold ${i <= currentStep ? 'text-green-600' : 'text-gray-400'}`}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 버튼 영역 */}
                <div className="flex gap-3 flex-wrap mt-2">
                  {/* 고객사: 제품발송 버튼만 */}
                  {!isAdmin && p.status === '승인' && (
                    <button
                      onClick={() => handleShipment(p.id)}
                      className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition"
                    >
                      📦 제품 발송 완료
                    </button>
                  )}

                  {/* 관리자: 상태 변경 */}
                  {isAdmin && (
                    <>
                      <select
                        value={p.status}
                        onChange={e => handleStatusUpdate(p.id, e.target.value)}
                        className="border rounded-xl px-4 py-2 text-sm font-semibold text-gray-700"
                      >
                        <option>신청</option>
                        <option>승인</option>
                        <option>제품발송</option>
                        <option>콘텐츠확인</option>
                        <option>완료</option>
                        <option>거절</option>
                      </select>
                      {p.payment_status !== '지급완료' && (
                        <button
                          onClick={() => handlePaymentUpdate(p.id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition"
                        >
                          💰 지급완료
                        </button>
                      )}
                      {p.payment_status === '지급완료' && (
                        <span className="text-sm text-green-600 font-semibold px-4 py-2">✅ 정산완료</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
          {participations.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
              <p>아직 신청한 인플루언서가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
