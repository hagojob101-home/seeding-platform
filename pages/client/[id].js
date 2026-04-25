import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function CampaignDetail() {
  const router = useRouter()
  const { id } = router.query
  const [campaign, setCampaign] = useState(null)
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedP, setSelectedP] = useState(null)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      const { data: c } = await supabase.from('campaigns').select('*').eq('id', id).single()
      setCampaign(c)
      const { data: p } = await supabase
        .from('participations')
        .select('*, users(*)')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })
      setParticipations(p || [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  const getFileUrl = (path) => {
    if (!path) return null
    const { data } = supabase.storage.from('documents').getPublicUrl(path)
    return data?.publicUrl
  }

  const handleStatusUpdate = async (pid, status) => {
    await supabase.from('participations').update({ status }).eq('id', pid)
    const { data: p } = await supabase
      .from('participations')
      .select('*, users(*)')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })
    setParticipations(p || [])
    if (selectedP?.id === pid) setSelectedP({ ...selectedP, status })
  }

  const handlePaymentUpdate = async (pid) => {
    await supabase.from('participations').update({ payment_status: '지급완료' }).eq('id', pid)
    const { data: p } = await supabase
      .from('participations')
      .select('*, users(*)')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })
    setParticipations(p || [])
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/client/dashboard')} className="text-gray-500 hover:text-purple-600">← 대시보드</button>
          <h1 className="text-xl font-bold text-purple-700">{campaign?.name}</h1>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">

        {/* 왼쪽: 신청자 목록 */}
        <div className="w-1/3">
          <h2 className="font-bold text-gray-700 mb-3">신청자 목록 ({participations.length}명)</h2>
          <div className="flex flex-col gap-2">
            {participations.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedP(p)}
                className={`bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition ${selectedP?.id === p.id ? 'ring-2 ring-purple-500' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{p.apply_data?.name || p.users?.name || '-'}</p>
                    <p className="text-xs text-gray-400">{p.apply_data?.instagram || '-'}</p>
                    <p className="text-xs text-gray-400">팔로워: {p.apply_data?.followers ? Number(p.apply_data.followers).toLocaleString() : '-'}</p>
                    <p className="text-xs font-semibold text-purple-600">원고료: {p.apply_data?.reward || '-'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                </div>
              </div>
            ))}
            {participations.length === 0 && <p className="text-gray-400 text-sm text-center py-10">신청자가 없습니다.</p>}
          </div>
        </div>

        {/* 오른쪽: 상세 정보 */}
        <div className="flex-1">
          {selectedP ? (
            <div className="flex flex-col gap-4">

              {/* 기본 정보 */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="font-bold text-gray-700 mb-4">📋 신청자 정보</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-400">이름</p><p className="font-semibold">{selectedP.apply_data?.name || '-'}</p></div>
                  <div><p className="text-gray-400">연락처</p><p className="font-semibold">{selectedP.apply_data?.phone || '-'}</p></div>
                  <div><p className="text-gray-400">이메일</p><p className="font-semibold">{selectedP.apply_data?.email || '-'}</p></div>
                  <div><p className="text-gray-400">주소</p><p className="font-semibold">{selectedP.apply_data?.address || '-'}</p></div>
                  <div><p className="text-gray-400">인스타그램</p><p className="font-semibold">{selectedP.apply_data?.instagram || '-'}</p></div>
                  <div><p className="text-gray-400">유튜브</p><p className="font-semibold">{selectedP.apply_data?.youtube || '-'}</p></div>
                  <div><p className="text-gray-400">팔로워 수</p><p className="font-semibold">{selectedP.apply_data?.followers ? Number(selectedP.apply_data.followers).toLocaleString() : '-'}</p></div>
                  <div><p className="text-gray-400">원고료</p><p className="font-bold text-purple-600">{selectedP.apply_data?.reward || '-'}</p></div>
                  <div><p className="text-gray-400">은행명</p><p className="font-semibold">{selectedP.apply_data?.bank_name || '-'}</p></div>
                  <div><p className="text-gray-400">계좌번호</p><p className="font-semibold">{selectedP.apply_data?.bank_account || '-'}</p></div>
                  <div><p className="text-gray-400">부계정 광고동의</p><p className="font-semibold">{selectedP.apply_data?.agree_ad ? '동의' : '미동의'}</p></div>
                  <div><p className="text-gray-400">성인인증</p><p className="font-semibold">{selectedP.apply_data?.is_adult || '-'}</p></div>
                </div>
              </div>

              {/* 파일 확인 */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="font-bold text-gray-700 mb-4">📁 업로드 파일</h3>
                <div className="flex flex-col gap-3">
                  {selectedP.apply_data?.id_file_url ? (
                    <a href={getFileUrl(selectedP.apply_data.id_file_url)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl hover:bg-blue-100 transition text-sm font-semibold">
                      🪪 신분증 사본 보기
                    </a>
                  ) : <p className="text-gray-400 text-sm">신분증 미업로드</p>}

                  {selectedP.apply_data?.bank_file_url ? (
                    <a href={getFileUrl(selectedP.apply_data.bank_file_url)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-3 rounded-xl hover:bg-green-100 transition text-sm font-semibold">
                      🏦 통장 사본 보기
                    </a>
                  ) : <p className="text-gray-400 text-sm">통장 미업로드</p>}

                  {selectedP.submit_data?.clean_file_url ? (
                    <a href={getFileUrl(selectedP.submit_data.clean_file_url)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-3 rounded-xl hover:bg-purple-100 transition text-sm font-semibold">
                      🎬 클린본 보기
                    </a>
                  ) : <p className="text-gray-400 text-sm">클린본 미제출</p>}

                  {selectedP.submit_data?.final_file_url ? (
                    <a href={getFileUrl(selectedP.submit_data.final_file_url)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-3 rounded-xl hover:bg-orange-100 transition text-sm font-semibold">
                      🎥 최종본 보기
                    </a>
                  ) : <p className="text-gray-400 text-sm">최종본 미제출</p>}

                  {selectedP.submit_data?.contract_file_url ? (
                    <a href={getFileUrl(selectedP.submit_data.contract_file_url)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 bg-yellow-50 text-yellow-600 px-4 py-3 rounded-xl hover:bg-yellow-100 transition text-sm font-semibold">
                      📝 서명된 계약서 보기
                    </a>
                  ) : <p className="text-gray-400 text-sm">서명된 계약서 미제출</p>}

                  {selectedP.submit_data?.upload_url && (
                    <a href={selectedP.submit_data.upload_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 bg-pink-50 text-pink-600 px-4 py-3 rounded-xl hover:bg-pink-100 transition text-sm font-semibold">
                      🔗 업로드 URL 확인
                    </a>
                  )}
                </div>
              </div>

              {/* 상태 변경 */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="font-bold text-gray-700 mb-4">⚙️ 상태 관리</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['신청', '승인', '제품발송', '콘텐츠확인', '완료', '거절'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusUpdate(selectedP.id, s)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${selectedP.status === s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">정산 상태:</span>
                  <span className={`text-sm px-3 py-1 rounded-full font-semibold ${selectedP.payment_status === '지급완료' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {selectedP.payment_status || '미지급'}
                  </span>
                  {selectedP.payment_status !== '지급완료' && (
                    <button onClick={() => handlePaymentUpdate(selectedP.id)} className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition">
                      지급완료 처리
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
              <p>왼쪽에서 신청자를 선택하면 상세 정보가 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
