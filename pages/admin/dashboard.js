import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import Footer from '../../components/Footer'

export default function AdminDashboard() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState([])
  const [participations, setParticipations] = useState([])
  const [clients, setClients] = useState([])
  const [campaignRequests, setCampaignRequests] = useState([])
  const [consultations, setConsultations] = useState([])
  const [tab, setTab] = useState('campaigns')
  const [loading, setLoading] = useState(true)
  const [selectedParticipation, setSelectedParticipation] = useState(null)
  const [selectedInfluencer, setSelectedInfluencer] = useState(null)
  const [imageModal, setImageModal] = useState(null) // { url, title }
  const [showForm, setShowForm] = useState(false)
  const [newCampaign, setNewCampaign] = useState({ name: '', product_name: '', description: '', form_type: 'basic' })

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login'); return }
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (userData?.role !== 'admin') { router.push('/client/login'); return }
      fetchData()
    }
    checkAdmin()
  }, [])

  const fetchData = async () => {
    const [c, p, cl, cr, co] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('participations').select('*, campaigns(name, product_name), users!participations_influencer_id_fkey(name, phone, address, instagram, youtube, bank_name, account_number, account_holder, id_card_url, bank_book_url)').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('campaign_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('consultations').select('*').order('created_at', { ascending: false }),
    ])
    setCampaigns(c.data || [])
    setParticipations(p.data || [])
    setClients(cl.data || [])
    setCampaignRequests(cr.data || [])
    setConsultations(co.data || [])
    setLoading(false)
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('campaigns').insert(newCampaign)
    if (error) { alert('오류: ' + error.message); return }
    alert('캠페인이 생성되었습니다!')
    setShowForm(false)
    setNewCampaign({ name: '', product_name: '', description: '', form_type: 'basic' })
    fetchData()
  }

  const handleDeleteCampaign = async (id, name) => {
    const { data: pData } = await supabase.from('participations').select('id').eq('campaign_id', id)
    const count = pData?.length || 0
    if (count > 0) {
      const first = window.confirm('⚠️ ' + name + ' 캠페인에\n인플루언서 신청 내역이 ' + count + '건 있어요.\n\n캠페인을 삭제하시겠어요?')
      if (!first) return
      const second = window.confirm('정말 삭제하시겠습니까?\n신청 내역 ' + count + '건이 함께 삭제되며\n복구가 불가능합니다.')
      if (!second) return
    } else {
      const ok = window.confirm(name + ' 캠페인을 삭제하시겠습니까?')
      if (!ok) return
    }
    const { error: pError } = await supabase.from('participations').delete().eq('campaign_id', id)
    if (pError) { alert('삭제 오류: ' + pError.message); return }
    const { error: cError } = await supabase.from('campaigns').delete().eq('id', id)
    if (cError) { alert('삭제 오류: ' + cError.message); return }
    alert('캠페인이 삭제되었습니다.')
    fetchData()
  }

  const handleStatusUpdate = async (id, status) => {
    await supabase.from('participations').update({ status }).eq('id', id)
    fetchData()
    if (selectedParticipation?.id === id) setSelectedParticipation(prev => ({ ...prev, status }))
  }

  const handlePaymentUpdate = async (id) => {
    await supabase.from('participations').update({ payment_status: '지급완료' }).eq('id', id)
    fetchData()
    if (selectedParticipation?.id === id) setSelectedParticipation(prev => ({ ...prev, payment_status: '지급완료' }))
  }

  const handleRequestApprove = async (id) => {
    const request = campaignRequests.find(r => r.id === id)
    if (!request) return
    const { data: newCampaignData, error: campaignError } = await supabase.from('campaigns').insert({
      name: request.product_name + ' 캠페인',
      product_name: request.product_name,
      description: request.company_name + ' 시딩 캠페인',
      form_type: 'basic',
      client_id: request.client_id,
      campaign_request_id: id,
    }).select().single()
    if (campaignError) { alert('캠페인 생성 오류: ' + campaignError.message); return }
    await supabase.from('campaign_requests').update({ status: '승인', campaign_id: newCampaignData.id }).eq('id', id)
    fetchData()
    alert('승인되었습니다! 캠페인이 자동 생성되었습니다.')
  }

  const handleRequestReject = async (id) => {
    const reason = window.prompt('거절 사유를 입력해주세요:')
    if (!reason) return
    const { error } = await supabase.from('campaign_requests').update({ status: '거절', rejection_reason: reason }).eq('id', id)
    if (error) { alert('오류: ' + error.message); return }
    alert('거절 처리되었습니다.')
    fetchData()
  }

  const getFileUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    const { data } = supabase.storage.from('influencer-files').getPublicUrl(path)
    return data?.publicUrl
  }

  const statusColor = (status) => {
    const map = {
      '신청': 'bg-yellow-100 text-yellow-700',
      '승인': 'bg-blue-100 text-blue-700',
      '제품발송': 'bg-purple-100 text-purple-700',
      '콘텐츠확인': 'bg-orange-100 text-orange-700',
      '업로드확인': 'bg-cyan-100 text-cyan-700',
      '정산완료': 'bg-green-100 text-green-700',
      '거절': 'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  const requestStatusColor = (status) => {
    const map = { '검토중': 'bg-yellow-100 text-yellow-700', '승인': 'bg-green-100 text-green-700', '거절': 'bg-red-100 text-red-700' }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  const STEPS = ['신청', '승인', '제품발송', '콘텐츠확인', '업로드확인', '정산완료']
  const STEP_LABELS = {
    '신청': '📋 신청',
    '승인': '✅ 승인',
    '제품발송': '📦 제품발송',
    '콘텐츠확인': '🎬 콘텐츠확인',
    '업로드확인': '🔗 업로드확인',
    '정산완료': '💰 정산완료',
  }

  const getStepIndex = (status) => {
    const map = { '신청': 0, '승인': 1, '제품발송': 2, '콘텐츠확인': 3, '업로드확인': 4, '정산완료': 5 }
    return map[status] ?? 0
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-700">🛠 관리자 대시보드</h1>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/client/login') }} className="text-sm text-gray-500 hover:text-red-500">로그아웃</button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 탭 메뉴 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'campaigns', label: '📋 캠페인 관리' },
            { id: 'participations', label: '👥 인플루언서 현황' },
            { id: 'requests', label: '📨 캠페인 요청', count: campaignRequests.filter(r => r.status === '검토중').length },
            { id: 'clients', label: '🏢 고객사 목록' },
            { id: 'payments', label: '💰 정산 관리', count: participations.filter(p => p.payment_request_status === '신청' && p.payment_status !== '지급완료').length },
            { id: 'consultations', label: '📞 컨설팅 신청', count: consultations.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${tab === t.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-purple-50'}`}>
              {t.label}
              {t.count > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* 캠페인 관리 탭 */}
        {tab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">캠페인 목록</h2>
              <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700">+ 새 캠페인</button>
            </div>
            {showForm && (
              <form onSubmit={handleCreateCampaign} className="bg-white rounded-2xl shadow p-6 mb-6 space-y-3">
                <input required placeholder="캠페인 이름" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} className="w-full border rounded-xl px-4 py-3" />
                <input required placeholder="제품명" value={newCampaign.product_name} onChange={e => setNewCampaign({...newCampaign, product_name: e.target.value})} className="w-full border rounded-xl px-4 py-3" />
                <textarea placeholder="설명" value={newCampaign.description} onChange={e => setNewCampaign({...newCampaign, description: e.target.value})} className="w-full border rounded-xl px-4 py-3" rows={3} />
                <select value={newCampaign.form_type} onChange={e => setNewCampaign({...newCampaign, form_type: e.target.value})} className="w-full border rounded-xl px-4 py-3">
                  <option value="basic">기본 폼</option>
                  <option value="liquor">주류 폼</option>
                </select>
                <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold">생성하기</button>
              </form>
            )}
            <div className="grid gap-4">
              {campaigns.map(c => (
                <div key={c.id} className="bg-white rounded-2xl shadow p-5 cursor-pointer hover:shadow-md transition" onClick={() => { setTab('participations') }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{c.name}</p>
                      <p className="text-sm text-gray-500">{c.product_name}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${c.form_type === 'liquor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.form_type === 'liquor' ? '🍶 주류' : '📋 일반'}
                    </span>
                  </div>
                  {c.description && <p className="text-sm text-gray-500 mt-2">{c.description}</p>}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.id, c.name) }}
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition">
                      🗑 삭제
                    </button>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && <p className="text-center text-gray-400 py-10">등록된 캠페인이 없습니다.</p>}
            </div>
          </div>
        )}

        {/* 인플루언서 현황 탭 */}
        {tab === 'participations' && (
          <div className="flex gap-6">
            {/* 왼쪽: 인플루언서 이름으로 그룹핑 */}
            <div className="w-80 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800 mb-4">인플루언서 현황</h2>
              <div className="flex flex-col gap-3">
                {(() => {
                  // 이름으로 그룹핑
                  const grouped = {}
                  participations.forEach(p => {
                    const name = p.apply_data?.name || p.name || '-'
                    if (!grouped[name]) grouped[name] = []
                    grouped[name].push(p)
                  })
                  return Object.entries(grouped).map(([name, items]) => (
                    <div key={name}
                      onClick={() => setSelectedInfluencer({ name, items })}
                      className={`bg-white rounded-2xl shadow p-4 cursor-pointer hover:shadow-md transition ${selectedInfluencer?.name === name ? 'ring-2 ring-purple-500' : ''}`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-gray-800">{name}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">{items.length}개 캠페인</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {items.map(p => (
                          <div key={p.id} className="flex justify-between items-center">
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{p.campaigns?.name || '-'}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
                {participations.length === 0 && <p className="text-center text-gray-400 py-10">신청 내역이 없습니다.</p>}
              </div>
            </div>

            {/* 오른쪽: 상세 정보 */}
            <div className="flex-1">
              {selectedInfluencer ? (
                <div className="bg-white rounded-2xl shadow p-6">
                  {/* 인플루언서 이름 */}
                  <h3 className="text-xl font-bold text-gray-800 mb-6">👤 {selectedInfluencer.name}</h3>

                  {/* 캠페인별 진행바 - 상단 */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-600 mb-4">📋 캠페인별 진행 현황</p>
                    <div className="flex flex-col gap-4">
                      {selectedInfluencer.items.map(p => (
                        <div key={p.id} className={`border rounded-2xl p-4 cursor-pointer transition ${selectedParticipation?.id === p.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                          onClick={() => setSelectedParticipation(p)}>
                          <div className="flex justify-between items-center mb-3">
                            <p className="font-semibold text-gray-800">{p.campaigns?.name || '-'}</p>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                          </div>
                          {/* 진행바 */}
                          <div className="flex items-center">
                            {STEPS.map((step, idx) => (
                              <div key={step} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                    idx <= getStepIndex(p.status)
                                      ? 'bg-purple-600 border-purple-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-400'
                                  }`}>
                                    {idx < getStepIndex(p.status) ? '✓' : idx + 1}
                                  </div>
                                  <p className={`text-xs mt-1 font-medium text-center ${idx <= getStepIndex(p.status) ? 'text-purple-600' : 'text-gray-400'}`}>{step}</p>
                                </div>
                                {idx < STEPS.length - 1 && (
                                  <div className={`h-0.5 w-full mb-4 ${idx < getStepIndex(p.status) ? 'bg-purple-600' : 'bg-gray-200'}`} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 선택된 캠페인 상태 변경 */}
                  {selectedParticipation && selectedInfluencer.items.find(i => i.id === selectedParticipation.id) && (
                    <div className="mb-6 bg-gray-50 rounded-2xl p-4">
                      <p className="text-sm font-semibold text-gray-600 mb-3">🔄 [{selectedParticipation.campaigns?.name}] 상태 변경</p>
                      {selectedParticipation.status === '신청' && (
                        <div className="flex gap-3">
                          <button onClick={() => handleStatusUpdate(selectedParticipation.id, '승인')} className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold hover:bg-green-600 transition">✅ 승인</button>
                          <button onClick={() => handleStatusUpdate(selectedParticipation.id, '거절')} className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition">❌ 거절</button>
                        </div>
                      )}
                      {selectedParticipation.status === '승인' && (
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '제품발송')} className="w-full bg-blue-500 text-white py-2 rounded-xl font-semibold hover:bg-blue-600 transition">📦 제품 발송 완료</button>
                      )}
                      {selectedParticipation.status === '제품발송' && (
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '콘텐츠확인')} className="w-full bg-orange-500 text-white py-2 rounded-xl font-semibold hover:bg-orange-600 transition">🎬 콘텐츠 확인 완료</button>
                      )}
                      {selectedParticipation.status === '콘텐츠확인' && (
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '업로드확인')} className="w-full bg-purple-500 text-white py-2 rounded-xl font-semibold hover:bg-purple-600 transition">📱 업로드 확인 완료</button>
                      )}
                      {selectedParticipation.status === '업로드확인' && (
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '정산완료')} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition">💰 정산 완료</button>
                      )}
                      {(selectedParticipation.status === '정산완료' || selectedParticipation.status === '완료') && (
                        <div className="text-center text-green-600 font-semibold py-2">✅ 정산 완료된 건입니다.</div>
                      )}
                    </div>
                  )}

                  {/* 개인정보 - 하단 */}
                  <div className="border-t pt-4 mt-2">
                    <p className="text-sm font-semibold text-gray-600 mb-3">👤 개인 정보</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-xs text-gray-400">이름</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.name || selectedInfluencer.name || '-'}</p></div>
                      <div><p className="text-xs text-gray-400">연락처</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.phone || '-'}</p></div>
                      <div><p className="text-xs text-gray-400">주소</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.address || '-'}</p></div>
                      <div><p className="text-xs text-gray-400">인스타그램</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.instagram || '-'}</p></div>
                      <div><p className="text-xs text-gray-400">팔로워 수</p><p className="font-semibold text-purple-600">{selectedInfluencer.items[0]?.followers?.toLocaleString() || '-'}명</p></div>
                      <div><p className="text-xs text-gray-400">은행/계좌</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.bank_name || '-'} {selectedInfluencer.items[0]?.users?.account_number || ''}</p></div>
                      <div><p className="text-xs text-gray-400">유튜브</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.youtube || '-'}</p></div>
                      <div><p className="text-xs text-gray-400">예금주</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.account_holder || '-'}</p></div>
                    </div>
                    {/* 신분증/통장 */}
                    <div className="mt-3 flex gap-3">
                      {selectedInfluencer.items[0]?.users?.id_card_url && (
                        <button onClick={() => setImageModal({ url: selectedInfluencer.items[0].users.id_card_url, title: '🪪 신분증' })}
                          className="text-xs text-blue-600 underline hover:text-blue-800 bg-transparent border-none cursor-pointer">🪪 신분증 보기</button>
                      )}
                      {selectedInfluencer.items[0]?.users?.bank_book_url && (
                        <button onClick={() => setImageModal({ url: selectedInfluencer.items[0].users.bank_book_url, title: '🏦 통장사본' })}
                          className="text-xs text-blue-600 underline hover:text-blue-800 bg-transparent border-none cursor-pointer">🏦 통장사본 보기</button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                  <p>왼쪽에서 인플루언서를 선택해주세요.</p>
                </div>
              )}
            </div>
            {/* 기존 selectedParticipation 상세 - 숨김 처리 */}
            <div className="hidden">
              {selectedParticipation ? (
                <div className="bg-white rounded-2xl shadow p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{selectedParticipation.apply_data?.name || '-'}</h3>
                      <p className="text-sm text-gray-500">{selectedParticipation.campaigns?.name || '-'}</p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full font-semibold ${statusColor(selectedParticipation.status)}`}>{selectedParticipation.status}</span>
                  </div>

                  {/* 진행 상황 바 */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-600 mb-3">진행 상황</p>
                    <div className="flex items-center gap-0">
                      {STEPS.map((step, idx) => (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              idx <= getStepIndex(selectedParticipation.status)
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'bg-white border-gray-300 text-gray-400'
                            }`}>
                              {idx < getStepIndex(selectedParticipation.status) ? '✓' : idx + 1}
                            </div>
                            <p className={`text-xs mt-1 font-medium ${idx <= getStepIndex(selectedParticipation.status) ? 'text-purple-600' : 'text-gray-400'}`}>{step}</p>
                          </div>
                          {idx < STEPS.length - 1 && (
                            <div className={`h-0.5 w-full mb-4 ${idx < getStepIndex(selectedParticipation.status) ? 'bg-purple-600' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 상태 변경 - 상단 */}
                  <div className="mb-6 bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-3">🔄 상태 변경</p>
                    {/* 신청 단계: 승인/거절 버튼 */}
                    {selectedParticipation.status === '신청' && (
                      <div className="flex gap-3">
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '승인')}
                          className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold hover:bg-green-600 transition">
                          ✅ 승인
                        </button>
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '거절')}
                          className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition">
                          ❌ 거절
                        </button>
                      </div>
                    )}
                    {/* 승인 단계: 제품발송 버튼 */}
                    {selectedParticipation.status === '승인' && (
                      <button onClick={() => handleStatusUpdate(selectedParticipation.id, '제품발송')}
                        className="w-full bg-purple-500 text-white py-2 rounded-xl font-semibold hover:bg-purple-600 transition">
                        📦 제품 발송 완료
                      </button>
                    )}
                    {/* 제품발송 단계: 콘텐츠확인 버튼 */}
                    {selectedParticipation.status === '제품발송' && (
                      <button onClick={() => handleStatusUpdate(selectedParticipation.id, '콘텐츠확인')}
                        className="w-full bg-orange-500 text-white py-2 rounded-xl font-semibold hover:bg-orange-600 transition">
                        🎬 콘텐츠 확인 완료
                      </button>
                    )}
                    {/* 콘텐츠확인 단계: 업로드확인 버튼 */}
                    {selectedParticipation.status === '콘텐츠확인' && (
                      <button onClick={() => handleStatusUpdate(selectedParticipation.id, '업로드확인')}
                        className="w-full bg-cyan-500 text-white py-2 rounded-xl font-semibold hover:bg-cyan-600 transition">
                        🔗 업로드 확인 완료
                      </button>
                    )}
                    {/* 업로드확인 단계: 정산완료 버튼 */}
                    {selectedParticipation.status === '업로드확인' && (
                      <button onClick={() => handleStatusUpdate(selectedParticipation.id, '정산완료')}
                        className="w-full bg-green-500 text-white py-2 rounded-xl font-semibold hover:bg-green-600 transition">
                        💰 정산 완료 처리
                      </button>
                    )}
                    {/* 완료/거절 상태 표시 */}
                    {(selectedParticipation.status === '정산완료' || selectedParticipation.status === '거절') && (
                      <div className={`text-center py-2 rounded-xl font-semibold text-sm ${selectedParticipation.status === '정산완료' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedParticipation.status === '정산완료' ? '✅ 정산 완료된 건입니다.' : '❌ 거절된 신청입니다.'}
                      </div>
                    )}
                    {/* 이전 단계로 되돌리기 */}
                    {!['신청', '정산완료', '거절'].includes(selectedParticipation.status) && (
                      <button onClick={() => {
                        const prev = STEPS[getStepIndex(selectedParticipation.status) - 1]
                        if (prev && window.confirm(prev + ' 단계로 되돌리시겠습니까?')) handleStatusUpdate(selectedParticipation.id, prev)
                      }} className="mt-2 w-full bg-white border border-gray-200 text-gray-500 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
                        ↩ 이전 단계로
                      </button>
                    )}
                  </div>

                  {/* 기본 정보 */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">이름</p>
                      <p className="font-semibold text-gray-800">{selectedParticipation.apply_data?.name || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">연락처</p>
                      <p className="font-semibold text-gray-800">{selectedParticipation.apply_data?.phone || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">주소</p>
                      <p className="font-semibold text-gray-800">{selectedParticipation.apply_data?.address || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">인스타그램</p>
                      <p className="font-semibold text-gray-800">@{selectedParticipation.apply_data?.instagram || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">팔로워 수</p>
                      <p className="font-semibold text-gray-800">{selectedParticipation.apply_data?.followers ? Number(selectedParticipation.apply_data.followers).toLocaleString() + '명' : '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">원고료</p>
                      <p className="font-semibold text-purple-600">{selectedParticipation.apply_data?.reward || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">은행/계좌</p>
                      <p className="font-semibold text-gray-800">{selectedParticipation.apply_data?.bank_name || '-'} {selectedParticipation.apply_data?.account_number || ''}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">정산 상태</p>
                      <p className={`font-semibold ${selectedParticipation.payment_status === '지급완료' ? 'text-green-600' : 'text-gray-400'}`}>
                        {selectedParticipation.payment_status === '지급완료' ? '✅ 지급완료' : '⏳ 대기중'}
                      </p>
                    </div>
                  </div>

                  {/* 제출 파일 */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-600 mb-3">📁 제출 파일</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: '🪪 신분증', key: 'id_card_url' },
                        { label: '🏦 통장사본', key: 'bank_book_url' },
                      ].map(({ label, key }) => {
                        const url = getFileUrl(selectedParticipation.apply_data?.[key])
                        return (
                          <div key={key} className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-1">{label}</p>
                            {url
                              ? <a href={url} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline text-sm font-semibold">📎 보기</a>
                              : <p className="text-gray-300 text-sm">미제출</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 콘텐츠 파일 */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-600 mb-3">🎬 콘텐츠 파일</p>
                    <div className="grid grid-cols-1 gap-3">
                      {/* 클린본 */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-bold text-blue-700">📍 클린본</p>
                          {selectedParticipation.submit_data?.clean_file_url
                            ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">✅ 제출됨</span>
                            : <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">미제출</span>}
                        </div>
                        {selectedParticipation.submit_data?.clean_file_url
                          ? <a href={getFileUrl(selectedParticipation.submit_data.clean_file_url)} target="_blank" rel="noreferrer"
                              className="text-blue-600 hover:underline text-sm font-semibold">📎 파일 다운로드</a>
                          : <p className="text-gray-400 text-sm">아직 제출되지 않았습니다.</p>}
                      </div>
                      {/* 최종본 */}
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-bold text-purple-700">📍 최종본</p>
                          {selectedParticipation.submit_data?.final_file_url
                            ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">✅ 제출됨</span>
                            : <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">미제출</span>}
                        </div>
                        {selectedParticipation.submit_data?.final_file_url
                          ? <a href={getFileUrl(selectedParticipation.submit_data.final_file_url)} target="_blank" rel="noreferrer"
                              className="text-purple-600 hover:underline text-sm font-semibold">📎 파일 다운로드</a>
                          : <p className="text-gray-400 text-sm">아직 제출되지 않았습니다.</p>}
                      </div>
                      {/* 업로드 URL */}
                      {selectedParticipation.submit_data?.upload_url && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <p className="text-sm font-bold text-green-700 mb-1">🔗 업로드 URL</p>
                          <a href={selectedParticipation.submit_data.upload_url} target="_blank" rel="noreferrer"
                            className="text-green-600 hover:underline text-sm">{selectedParticipation.submit_data.upload_url}</a>
                        </div>
                      )}
                      {/* 서명 계약서 */}
                      {selectedParticipation.submit_data?.signed_contract_url && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                          <p className="text-sm font-bold text-orange-700 mb-2">📝 서명된 계약서</p>
                          <a href={getFileUrl(selectedParticipation.submit_data.signed_contract_url)} target="_blank" rel="noreferrer"
                            className="text-orange-600 hover:underline text-sm font-semibold">📎 계약서 보기</a>
                        </div>
                      )}
                    </div>
                  </div>




                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow p-10 text-center">
                  <p className="text-gray-400">왼쪽에서 인플루언서를 선택해주세요.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 캠페인 요청 탭 */}
        {tab === 'requests' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">캠페인 요청 목록</h2>
            <div className="grid gap-4">
              {campaignRequests.map(r => (
                <div key={r.id} className="bg-white rounded-2xl shadow p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{r.product_name}</p>
                      <p className="text-sm text-gray-500">{r.company_name}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${requestStatusColor(r.status)}`}>{r.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div><p className="text-gray-400">월 버짓</p><p className="font-bold text-purple-600">{r.monthly_budget ? Number(r.monthly_budget).toLocaleString() + '원' : '-'}</p></div>
                    <div><p className="text-gray-400">제품 가격</p><p className="font-semibold">{r.product_price ? Number(r.product_price).toLocaleString() + '원' : '-'}</p></div>
                    <div><p className="text-gray-400">최소 인플루언서</p><p className="font-semibold">{r.min_influencers}명</p></div>
                    <div><p className="text-gray-400">요청일</p><p className="font-semibold">{new Date(r.created_at).toLocaleDateString('ko-KR')}</p></div>
                    <div className="col-span-2"><p className="text-gray-400">제품 URL</p>
                      {r.product_url ? <a href={r.product_url} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">{r.product_url}</a> : <p>-</p>}
                    </div>
                  </div>
                  {r.status === '검토중' && (
                    <div className="flex gap-3">
                      <button onClick={() => handleRequestApprove(r.id)} className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold hover:bg-green-600 transition">✅ 승인</button>
                      <button onClick={() => handleRequestReject(r.id)} className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition">❌ 거절</button>
                    </div>
                  )}
                  {r.rejection_reason && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm text-red-600"><span className="font-semibold">거절 사유:</span> {r.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ))}
              {campaignRequests.length === 0 && <p className="text-center text-gray-400 py-10">캠페인 요청이 없습니다.</p>}
            </div>
          </div>
        )}

        {/* 고객사 목록 탭 */}
        {tab === 'clients' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">고객사 목록</h2>
            <div className="grid gap-4">
              {clients.map(c => (
                <div key={c.id} className="bg-white rounded-2xl shadow p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{c.company_name}</p>
                      <p className="text-sm text-gray-500">{c.email}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold">고객사</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div><p className="text-gray-400">홈페이지</p>
                      {c.homepage ? <a href={c.homepage} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline font-semibold">{c.homepage}</a> : <p>-</p>}
                    </div>
                    <div><p className="text-gray-400">사업자등록증</p>
                      {c.business_reg_url ? <span className="text-green-600 font-semibold">✅ 업로드됨</span> : <span className="text-gray-400">미업로드</span>}
                    </div>
                  </div>
                </div>
              ))}
              {clients.length === 0 && <p className="text-center text-gray-400 py-10">등록된 고객사가 없습니다.</p>}
            </div>
          </div>
        )}

        {/* 정산 관리 탭 */}
        {tab === 'payments' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">💰 정산 관리</h2>
            <div className="grid gap-4">
              {participations.filter(p => p.payment_request_status === '신청').length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                  <p>정산 신청 내역이 없습니다.</p>
                </div>
              ) : (
                participations.filter(p => p.payment_request_status === '신청').map(p => (
                  <div key={p.id} className="bg-white rounded-2xl shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-800 text-lg">{p.apply_data?.name || '-'}</p>
                        <p className="text-sm text-gray-500">{p.campaigns?.name || '-'}</p>
                      </div>
                      {p.payment_status === '지급완료' ? (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">✅ 지급완료</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">⏳ 정산대기</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">원고료</p>
                        <p className="font-bold text-purple-600">{p.apply_data?.reward || '-'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">은행/계좌</p>
                        <p className="font-semibold text-gray-800">{p.apply_data?.bank_name || '-'} {p.apply_data?.account_number || ''}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">예금주</p>
                        <p className="font-semibold text-gray-800">{p.apply_data?.account_holder || p.apply_data?.name || '-'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">신청일</p>
                        <p className="font-semibold text-gray-800">{p.payment_request_at ? new Date(p.payment_request_at).toLocaleDateString('ko-KR') : '-'}</p>
                      </div>
                    </div>
                    {p.payment_status !== '지급완료' && (
                      <button onClick={() => handlePaymentUpdate(p.id)}
                        className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition">
                        💰 정산 완료 처리
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 컨설팅 신청 탭 */}
        {tab === 'consultations' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">📞 컨설팅 신청 목록</h2>
            <div className="grid gap-4">
              {consultations.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                  <p>컨설팅 신청 내역이 없습니다.</p>
                </div>
              ) : (
                consultations.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl shadow p-6">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString('ko-KR')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-2">
                      <div>
                        <p className="text-xs text-gray-400">담당자</p>
                        <p className="font-bold text-gray-800">{c.manager_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">직함/직위</p>
                        <p className="text-gray-700">{c.job_title || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">전화번호</p>
                        <p className="text-gray-700">{c.phone_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">SNS URL</p>
                        <p className="text-gray-700 text-sm break-all">{c.sns_url || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">홈페이지</p>
                        <p className="text-gray-700 text-sm break-all">{c.website_url || '-'}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-400">문의 내용</p>
                      <p className="text-gray-700 mt-1 bg-gray-50 rounded-xl p-3">{c.inquiry_message || '-'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
      {/* 이미지 모달 */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-gray-800">{imageModal.title}</p>
              <button onClick={() => setImageModal(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">×</button>
            </div>
            <img src={imageModal.url} alt={imageModal.title}
              className="w-full rounded-xl object-contain max-h-[70vh]" />
          </div>
        </div>
      )}
  )
}
