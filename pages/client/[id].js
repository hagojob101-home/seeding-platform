import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import FileLink from '../../components/FileLink'
import Progress from '../../components/Progress'

export default function ClientCampaignDetail() {
  const router = useRouter()
  const { id } = router.query
  const [campaign, setCampaign] = useState(null)
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)

  const STEPS = ['신청', '승인', '제품발송', '콘텐츠확인', '완료']

  // 업로드확인 이후(정산 단계 포함)는 고객사 화면에서 '완료'로 표시
  const getStepIndex = (status) => ['업로드확인', '정산요청', '정산완료'].includes(status) ? 4 : STEPS.indexOf(status)


  useEffect(() => {
    if (!id) return
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login'); return }
      const { data: cData } = await supabase.from('campaigns').select('*').eq('id', id).single()
      setCampaign(cData)
      const { data: pData } = await supabase.rpc('campaign_participants', { p_campaign_id: id })
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
      '신청': 'bg-highlight text-ink',
      '승인': 'bg-highlight text-ink',
      '제품발송': 'bg-highlight text-ink',
      '콘텐츠확인': 'bg-highlight text-ink',
      '완료': 'bg-highlight text-ink',
      '거절': 'bg-highlight text-ink',
    }
    return map[status] || 'bg-highlight text-ink'
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-highlight ">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/client/dashboard')} className="text-muted hover:text-ink text-sm">← 뒤로</button>
          <h1 className="text-lg font-bold text-ink">{campaign?.name}</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-ink">
            인플루언서 진행 현황 ({participations.length}명)
          </h2>
        </div>

        {participations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-muted">
            <p>아직 신청한 인플루언서가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {participations.map(p => {
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow p-6">
                  {/* 인플루언서 기본 정보 */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-ink text-lg">{p.name || '-'}</p>
                      <div className="flex gap-4 text-sm text-muted mt-1">
                        <span>{p.phone || '-'}</span>
                        <span>{p.address || '-'}</span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted mt-1">
                        <span>@{p.instagram || '-'} · 팔로워 {p.apply_data?.followers ? Number(p.apply_data.followers).toLocaleString() : '-'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink text-lg">{p.apply_data?.reward || (p.fee ? Number(p.fee).toLocaleString() + '원' : '-')}</p>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                    </div>
                  </div>

                  {/* 진행 상황 */}
                  <div className="mb-4"><Progress steps={STEPS} current={getStepIndex(p.status)} /></div>

                  {/* 발송 버튼 - 승인 상태일 때만 */}
                  {p.status === '승인' && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleShip(p.id)}
                        className="bg-ink text-white px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition text-sm"
                      >
                        제품 발송 완료
                      </button>
                    </div>
                  )}

                  {/* 콘텐츠 제출 여부 */}
                  {p.submit_data && (
                    <div className="mt-4 bg-highlight border border-line rounded-xl p-4">
                      <p className="text-sm font-bold text-ink mb-2">콘텐츠 제출됨</p>
                      <div className="flex gap-3 flex-wrap">
                        {p.submit_data.clean_file_url && (
                          <FileLink path={p.submit_data.clean_file_url}
                            className="text-ink hover:underline text-sm font-semibold bg-highlight px-3 py-1 rounded-lg">
                            클린본 보기
                          </FileLink>
                        )}
                        {p.submit_data.final_file_url && (
                          <FileLink path={p.submit_data.final_file_url}
                            className="text-ink hover:underline text-sm font-semibold bg-highlight px-3 py-1 rounded-lg">
                            최종본 보기
                          </FileLink>
                        )}
                        {p.submit_data.upload_url && (
                          <a href={p.submit_data.upload_url} target="_blank" rel="noreferrer"
                            className="text-ink hover:underline text-sm font-semibold bg-highlight px-3 py-1 rounded-lg">
                            업로드 URL
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
