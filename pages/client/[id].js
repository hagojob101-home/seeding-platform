import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientCampaignDetail() {
  const router = useRouter()
  const { id } = router.query
  const [campaign, setCampaign] = useState(null)
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)

  const STEPS = ['신청', '승인', '제품발송', '콘텐츠확인', '완료']

  const getStepIndex = (status) => STEPS.indexOf(status)

  const stepIcons = ['📋', '✅', '📦', '🎬', '🏆']

  useEffect(() => {
    if (!id) return
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login'); return }
      const { data: cData } = await supabase.from('campaigns').select('*').eq('id', id).single()
      setCampaign(cData)
      const { data: pData } = await supabase
        .from('participations')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })
      setParticipations(pData || [])
      setLoading(false)
    }
    init()
  }, [id])

  const handleShip = async (participationId) => {
    const { error } = await supabase.from('participations').update({ status: '제품발송' }).eq('id', participationId)
    if (error) { alert('오류: ' + error.message); return }
    setParticipations(prev => prev.map(p => p.id === participationId ? { ...p, status: '제품발송' } : p))
    alert('제품 발송 완료로 변경되었습니다!')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/client/dashboard')} className="text-gray-400 hover:text-blue-600 text-sm">← 뒤로</button>
          <h1 className="text-lg font-bold text-blue-700">{campaign?.name}</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            👥 인플루언서 진행 현황 ({participations.length}명)
          </h2>
        </div>

        {participations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
            <p>아직 신청한 인플루언서가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {participations.map(p => {
              const stepIdx = getStepIndex(p.status)
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow p-6">
                  {/* 인플루언서 기본 정보 */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{p.apply_data?.name || '-'}</p>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        <span>📱 {p.apply_data?.phone || '-'}</span>
                        <span>📍 {p.apply_data?.address || '-'}</span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        <span>📸 @{p.apply_data?.instagram || '-'} · 팔로워 {p.apply_data?.followers ? Number(p.apply_data.followers).toLocaleString() : '-'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600 text-lg">{p.apply_data?.reward || (p.fee ? Number(p.fee).toLocaleString() + '원' : '-')}</p>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                    </div>
                  </div>

                  {/* 진행 상황 바 */}
                  <div className="mb-4">
                    <div className="flex items-center">
                      {STEPS.map((step, idx) => (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                              idx < stepIdx
                                ? 'bg-green-500 border-green-500 text-white'
                                : idx === stepIdx
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'bg-white border-gray-200 text-gray-300'
                            }`}>
                              {idx < stepIdx ? '✓' : stepIcons[idx]}
                            </div>
                            <p className={`text-xs mt-1 font-medium whitespace-nowrap ${
                              idx <= stepIdx ? 'text-blue-600' : 'text-gray-300'
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

                  {/* 발송 버튼 - 승인 상태일 때만 */}
                  {p.status === '승인' && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleShip(p.id)}
                        className="bg-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-purple-700 transition text-sm"
                      >
                        📦 제품 발송 완료
                      </button>
                    </div>
                  )}

                  {/* 콘텐츠 제출 여부 */}
                  {p.submit_data && (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-orange-700 mb-2">🎬 콘텐츠 제출됨</p>
                      <div className="flex gap-3 flex-wrap">
                        {p.submit_data.clean_file_url && (
                          <a href={p.submit_data.clean_file_url} target="_blank" rel="noreferrer"
                            className="text-blue-600 hover:underline text-sm font-semibold bg-blue-50 px-3 py-1 rounded-lg">
                            📍 클린본 보기
                          </a>
                        )}
                        {p.submit_data.final_file_url && (
                          <a href={p.submit_data.final_file_url} target="_blank" rel="noreferrer"
                            className="text-purple-600 hover:underline text-sm font-semibold bg-purple-50 px-3 py-1 rounded-lg">
                            📍 최종본 보기
                          </a>
                        )}
                        {p.submit_data.upload_url && (
                          <a href={p.submit_data.upload_url} target="_blank" rel="noreferrer"
                            className="text-green-600 hover:underline text-sm font-semibold bg-green-50 px-3 py-1 rounded-lg">
                            🔗 업로드 URL
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
