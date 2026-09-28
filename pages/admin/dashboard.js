import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import Footer from '../../components/Footer'
import FileLink, { signedUrl } from '../../components/FileLink'
import { PARTICIPATION_STEPS } from '../../lib/constants'
import Progress, { StepLabels } from '../../components/Progress'

export default function AdminDashboard() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState([])
  const [participations, setParticipations] = useState([])
  const [clients, setClients] = useState([])
  const [campaignRequests, setCampaignRequests] = useState([])
  const [consultations, setConsultations] = useState([])
  const { tab: tabQuery } = router.query
  const [tab, setTab] = useState('campaigns')
  const [agencies, setAgencies] = useState([])
  const [selectedAgency, setSelectedAgency] = useState(null)
  const [agencyInfluencers, setAgencyInfluencers] = useState([])
  
  useEffect(() => {
    if (tabQuery) setTab(tabQuery)
  }, [tabQuery])

  useEffect(() => {
    if (router.query.agency && agencies.length > 0) {
      const found = agencies.find(a => a.id === router.query.agency)
      if (found) setSelectedAgency(found)
    }
  }, [router.query.agency, agencies])

  useEffect(() => {
    if (selectedAgency) {
      supabase.from('client_influencers')
        .select('*')
        .eq('client_id', selectedAgency.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => setAgencyInfluencers(data || []))
    }
  }, [selectedAgency])
  const [loading, setLoading] = useState(true)
  const [selectedParticipation, setSelectedParticipation] = useState(null)
  const [selectedInfluencer, setSelectedInfluencer] = useState(null)
  const [imageModal, setImageModal] = useState(null) // { url, title }
  const [showForm, setShowForm] = useState(false)
  const [signedIn, setSignedIn] = useState({}) // 광고주 user_id → 로그인 이력 여부
  const [invite, setInvite] = useState(null) // 초대 입력값 (null = 닫힘)
  const [inviteMsg, setInviteMsg] = useState('')
  const [newCampaign, setNewCampaign] = useState({ name: '', product_name: '', description: '', form_type: 'basic' })

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login?as=admin'); return }
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (userData?.role !== 'admin') { router.push('/client/login?as=admin'); return }
      fetchData()
    }
    checkAdmin()
  }, [])

  const fetchData = async () => {
    const [c, p, cl, co, st] = await Promise.all([
      supabase.from('campaigns').select('*, clients(company_name)').order('created_at', { ascending: false }),
      supabase.from('participations').select('*, campaigns(name, product_name), users!participations_influencer_id_fkey(name, phone, address, instagram, youtube, payout_profiles(bank_name, account_number, account_holder, id_card_path, bank_book_path, verified))').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('consultations').select('*').order('created_at', { ascending: false }),
      supabase.rpc('client_account_status'),
    ])
    setSignedIn(Object.fromEntries((st.data || []).map(r => [r.user_id, !!r.last_sign_in_at])))
    // 캠페인 하나의 표: 요청·거절은 '캠페인 요청' 탭, 진행·완료는 '캠페인 관리' 탭
    const all = c.data || []
    setCampaigns(all.filter(x => x.status === '진행' || x.status === '완료'))
    setCampaignRequests(all.filter(x => x.status === '요청' || x.status === '거절'))
    setParticipations(p.data || [])
    setClients(cl.data || [])
    setConsultations(co.data || [])
    setAgencies(cl.data || [])
    setLoading(false)
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('campaigns').insert({ ...newCampaign, status: '진행' })
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
      const first = window.confirm('' + name + ' 캠페인에\n인플루언서 신청 내역이 ' + count + '건 있어요.\n\n캠페인을 삭제하시겠어요?')
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
    await handleStatusUpdate(id, '정산완료')
  }

  const handleRequestApprove = async (id) => {
    const { error } = await supabase.from('campaigns').update({ status: '진행' }).eq('id', id)
    if (error) { alert('오류: ' + error.message); return }
    fetchData()
    alert('승인되었습니다! 캠페인이 진행 상태로 바뀌었습니다.')
  }

  const handleRequestReject = async (id) => {
    const reason = window.prompt('거절 사유를 입력해주세요:')
    if (!reason) return
    const { error } = await supabase.from('campaigns').update({ status: '거절', rejection_reason: reason }).eq('id', id)
    if (error) { alert('오류: ' + error.message); return }
    alert('거절 처리되었습니다.')
    fetchData()
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteMsg('보내는 중...')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/invite-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify(invite),
    }).catch(() => null)
    const body = await res?.json().catch(() => ({}))
    if (!res?.ok) return setInviteMsg(body?.error || '네트워크 오류가 발생했습니다.')
    setInviteMsg(`${invite.email}로 초대 메일을 보냈습니다.`)
    setInvite(null)
    fetchData()
  }

  const payout = (p) => p?.users?.payout_profiles || {}
  const openImage = async (path, title) => {
    const [url, downloadUrl] = await Promise.all([signedUrl(path), signedUrl(path, true)])
    setImageModal({ url, downloadUrl, path, title })
  }

  const statusColor = (status) => {
    const map = {
      '신청': 'bg-highlight text-ink',
      '승인': 'bg-highlight text-ink',
      '제품발송': 'bg-highlight text-ink',
      '콘텐츠확인': 'bg-highlight text-ink',
      '업로드확인': 'bg-highlight text-ink',
      '정산요청': 'bg-highlight text-ink',
      '정산완료': 'bg-highlight text-ink',
      '거절': 'bg-highlight text-ink',
    }
    return map[status] || 'bg-highlight text-ink'
  }

  const requestStatusColor = (status) => {
    const map = { '요청': 'bg-highlight text-ink', '진행': 'bg-highlight text-ink', '거절': 'bg-highlight text-ink' }
    return map[status] || 'bg-highlight text-ink'
  }


const STEPS = PARTICIPATION_STEPS
  const STEP_LABELS = {
    '신청': '신청',
    '승인': '승인',
    '제품발송': '제품발송',
    '콘텐츠확인': '콘텐츠확인',
    '업로드확인': '업로드확인',
    '정산요청': '정산요청',
    '정산완료': '정산완료',
  }

  const getStepIndex = (status) => {
    return Math.max(0, STEPS.indexOf(status))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-highlight">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-ink">관리자 대시보드</h1>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/client/login?as=admin') }} className="text-sm text-muted hover:text-ink">로그아웃</button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 탭 메뉴 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'campaigns', label: '캠페인 관리' },
            { id: 'participations', label: '인플루언서 현황' },
            { id: 'requests', label: '캠페인 요청', count: campaignRequests.filter(r => r.status === '요청').length },
            { id: 'clients', label: '광고주 목록' },
            { id: 'agencydb', label: '광고주 DB' },
            { id: 'payments', label: '정산 관리', count: participations.filter(p => p.status === '정산요청').length },
            { id: 'consultations', label: '컨설팅 신청', count: consultations.length },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); router.push({ pathname: '/admin/dashboard', query: { tab: t.id } }, undefined, { shallow: true }) }}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${tab === t.id ? 'bg-ink text-white' : 'bg-white text-muted hover:bg-highlight'}`}>
              {t.label}
              {t.count > 0 && <span className="bg-ink text-white text-xs px-2 py-0.5 rounded-full">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* 캠페인 관리 탭 */}
        {tab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-ink">캠페인 목록</h2>
              <button onClick={() => setShowForm(!showForm)} className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90">+ 새 캠페인</button>
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
                <button type="submit" className="w-full bg-ink text-white py-3 rounded-xl font-semibold">생성하기</button>
              </form>
            )}
            <div className="grid gap-4">
              {campaigns.map(c => (
                <div key={c.id} className="bg-white rounded-2xl shadow p-5 cursor-pointer hover:shadow-sm transition" onClick={() => { setTab('participations') }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-ink text-lg">{c.name}</p>
                      <p className="text-sm text-muted">{c.product_name}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${c.form_type === 'liquor' ? 'bg-highlight text-ink' : 'bg-highlight text-ink'}`}>
                      {c.form_type === 'liquor' ? '주류' : '일반'}
                    </span>
                  </div>
                  {c.description && <p className="text-sm text-muted mt-2">{c.description}</p>}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.id, c.name) }}
                      className="text-xs text-muted hover:text-ink hover:bg-highlight px-3 py-1 rounded-lg transition">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && <p className="text-center text-muted py-10">등록된 캠페인이 없습니다.</p>}
            </div>
          </div>
        )}

        {/* 인플루언서 현황 탭 */}
        {tab === 'participations' && (
          <div className="flex gap-6">
            {/* 왼쪽: 인플루언서 이름으로 그룹핑 */}
            <div className="w-80 flex-shrink-0">
              <h2 className="text-lg font-bold text-ink mb-4">인플루언서 현황</h2>
              <div className="flex flex-col gap-3">
                {(() => {
                  // 이름으로 그룹핑
                  const grouped = {}
                  participations.forEach(p => {
                    const name = p.users?.name || p.name || '-'
                    if (!grouped[name]) grouped[name] = []
                    grouped[name].push(p)
                  })
                  return Object.entries(grouped).map(([name, items]) => (
                    <div key={name}
                      onClick={() => setSelectedInfluencer({ name, items })}
                      className={`bg-white rounded-2xl shadow p-4 cursor-pointer hover:shadow-sm transition ${selectedInfluencer?.name === name ? 'ring-2 ring-ink' : ''}`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-ink">{name}</p>
                        <span className="text-xs bg-highlight text-ink px-2 py-1 rounded-full font-semibold">{items.length}개 캠페인</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {items.map(p => (
                          <div key={p.id} className="flex justify-between items-center">
                            <p className="text-xs text-muted truncate max-w-[150px]">{p.campaigns?.name || '-'}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
                {participations.length === 0 && <p className="text-center text-muted py-10">신청 내역이 없습니다.</p>}
              </div>
            </div>

            {/* 오른쪽: 상세 정보 */}
            <div className="flex-1">
              {selectedInfluencer ? (
                <div className="bg-white rounded-2xl shadow p-6">
                  {/* 인플루언서 이름 */}
                  <h3 className="text-xl font-bold text-ink mb-6">{selectedInfluencer.name}</h3>

                  {/* 캠페인별 진행바 - 상단 */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-muted mb-4">캠페인별 진행 현황</p>
                    {/* 단계 이름은 목록 위에 한 번만 (카드 안쪽 여백과 맞춤) */}
                    <div className="px-4 border border-transparent mb-2"><StepLabels /></div>
                    <div className="flex flex-col gap-4">
                      {selectedInfluencer.items.map(p => (
                        <div key={p.id} className={`border rounded-2xl p-4 cursor-pointer transition ${selectedParticipation?.id === p.id ? 'border-ink bg-highlight' : 'border-line hover:border-line'}`}
                          onClick={() => setSelectedParticipation(p)}>
                          <div className="flex justify-between items-center mb-3">
                            <p className="font-semibold text-ink">{p.campaigns?.name || '-'}</p>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                          </div>
                          {/* 진행바 */}
                          <Progress current={STEPS.indexOf(p.status)} labels={false} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 선택된 캠페인 상태 변경 */}
                  {selectedParticipation && selectedInfluencer.items.find(i => i.id === selectedParticipation.id) && (
                    <div className="mb-6 bg-highlight rounded-2xl p-4">
                      <p className="text-sm font-semibold text-muted mb-3">[{selectedParticipation.campaigns?.name}] 상태 변경</p>
                      {selectedParticipation.status === '신청' && (
                        <div className="flex gap-3">
                          <button onClick={() => handleStatusUpdate(selectedParticipation.id, '승인')} className="flex-1 bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">승인</button>
                          <button onClick={() => handleStatusUpdate(selectedParticipation.id, '거절')} className="flex-1 bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">거절</button>
                        </div>
                      )}
                      {selectedParticipation.status === '승인' && (
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '제품발송')} className="w-full bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">제품 발송 완료</button>
                      )}
                      {selectedParticipation.status === '제품발송' && (
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '콘텐츠확인')} className="w-full bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">콘텐츠 확인 완료</button>
                      )}
                      {selectedParticipation.status === '콘텐츠확인' && (
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '업로드확인')} className="w-full bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">업로드 확인 완료</button>
                      )}
                      {selectedParticipation.status === '업로드확인' && (
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '정산완료')} className="w-full bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">정산 완료</button>
                      )}
                      {(selectedParticipation.status === '정산완료' || selectedParticipation.status === '완료') && (
                        <div className="text-center text-ink font-semibold py-2">정산 완료된 건입니다.</div>
                      )}
                    </div>
                  )}

                  {/* 개인정보 - 하단 */}
                  <div className="border-t pt-4 mt-2">
                    <p className="text-sm font-semibold text-muted mb-3">개인 정보</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-xs text-muted">이름</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.name || selectedInfluencer.name || '-'}</p></div>
                      <div><p className="text-xs text-muted">연락처</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.phone || '-'}</p></div>
                      <div><p className="text-xs text-muted">주소</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.address || '-'}</p></div>
                      <div><p className="text-xs text-muted">인스타그램</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.instagram || '-'}</p></div>
                      <div><p className="text-xs text-muted">팔로워 수</p><p className="font-semibold text-ink">{selectedInfluencer.items[0]?.followers?.toLocaleString() || '-'}명</p></div>
                      <div><p className="text-xs text-muted">은행/계좌</p><p className="font-semibold">{payout(selectedInfluencer.items[0]).bank_name || '-'} {payout(selectedInfluencer.items[0]).account_number || ''}</p></div>
                      <div><p className="text-xs text-muted">유튜브</p><p className="font-semibold">{selectedInfluencer.items[0]?.users?.youtube || '-'}</p></div>
                      <div><p className="text-xs text-muted">예금주</p><p className="font-semibold">{payout(selectedInfluencer.items[0]).account_holder || '-'}</p></div>
                    </div>
                    {/* 신분증/통장 */}
                    <div className="mt-3 flex gap-3">
                      {payout(selectedInfluencer.items[0]).id_card_path && (
                        <button onClick={() => openImage(payout(selectedInfluencer.items[0]).id_card_path, '신분증')}
                          className="text-xs text-ink underline hover:text-ink bg-transparent border-none cursor-pointer">신분증 보기</button>
                      )}
                      {payout(selectedInfluencer.items[0]).bank_book_path && (
                        <button onClick={() => openImage(payout(selectedInfluencer.items[0]).bank_book_path, '통장사본')}
                          className="text-xs text-ink underline hover:text-ink bg-transparent border-none cursor-pointer">통장사본 보기</button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow p-10 text-center text-muted">
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
                      <h3 className="text-xl font-bold text-ink">{selectedParticipation.users?.name || '-'}</h3>
                      <p className="text-sm text-muted">{selectedParticipation.campaigns?.name || '-'}</p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full font-semibold ${statusColor(selectedParticipation.status)}`}>{selectedParticipation.status}</span>
                  </div>

                  {/* 진행 상황 바 */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-muted mb-3">진행 상황</p>
                    <Progress current={STEPS.indexOf(selectedParticipation.status)} />
                  </div>

                  {/* 상태 변경 - 상단 */}
                  <div className="mb-6 bg-highlight rounded-2xl p-4">
                    <p className="text-sm font-semibold text-muted mb-3">상태 변경</p>
                    {/* 신청 단계: 승인/거절 버튼 */}
                    {selectedParticipation.status === '신청' && (
                      <div className="flex gap-3">
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '승인')}
                          className="flex-1 bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">
                          승인
                        </button>
                        <button onClick={() => handleStatusUpdate(selectedParticipation.id, '거절')}
                          className="flex-1 bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">
                          거절
                        </button>
                      </div>
                    )}
                    {/* 승인 단계: 제품발송 버튼 */}
                    {selectedParticipation.status === '승인' && (
                      <button onClick={() => handleStatusUpdate(selectedParticipation.id, '제품발송')}
                        className="w-full bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">
                        제품 발송 완료
                      </button>
                    )}
                    {/* 제품발송 단계: 콘텐츠확인 버튼 */}
                    {selectedParticipation.status === '제품발송' && (
                      <button onClick={() => handleStatusUpdate(selectedParticipation.id, '콘텐츠확인')}
                        className="w-full bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">
                        콘텐츠 확인 완료
                      </button>
                    )}
                    {/* 콘텐츠확인 단계: 업로드확인 버튼 */}
                    {selectedParticipation.status === '콘텐츠확인' && (
                      <button onClick={() => handleStatusUpdate(selectedParticipation.id, '업로드확인')}
                        className="w-full bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">
                        업로드 확인 완료
                      </button>
                    )}
                    {/* 업로드확인 단계: 정산완료 버튼 */}
                    {selectedParticipation.status === '업로드확인' && (
                      <button onClick={() => handleStatusUpdate(selectedParticipation.id, '정산완료')}
                        className="w-full bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">
                        정산 완료 처리
                      </button>
                    )}
                    {/* 완료/거절 상태 표시 */}
                    {(selectedParticipation.status === '정산완료' || selectedParticipation.status === '거절') && (
                      <div className={`text-center py-2 rounded-xl font-semibold text-sm ${selectedParticipation.status === '정산완료' ? 'bg-highlight text-ink' : 'bg-highlight text-ink'}`}>
                        {selectedParticipation.status === '정산완료' ? '정산 완료된 건입니다.' : '거절된 신청입니다.'}
                      </div>
                    )}
                    {/* 이전 단계로 되돌리기 */}
                    {!['신청', '정산완료', '거절'].includes(selectedParticipation.status) && (
                      <button onClick={() => {
                        const prev = STEPS[getStepIndex(selectedParticipation.status) - 1]
                        if (prev && window.confirm(prev + ' 단계로 되돌리시겠습니까?')) handleStatusUpdate(selectedParticipation.id, prev)
                      }} className="mt-2 w-full bg-white border border-line text-muted py-2 rounded-xl text-sm hover:bg-highlight transition">
                        ↩ 이전 단계로
                      </button>
                    )}
                  </div>

                  {/* 기본 정보 */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-highlight rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">이름</p>
                      <p className="font-semibold text-ink">{selectedParticipation.users?.name || '-'}</p>
                    </div>
                    <div className="bg-highlight rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">연락처</p>
                      <p className="font-semibold text-ink">{selectedParticipation.users?.phone || '-'}</p>
                    </div>
                    <div className="bg-highlight rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">주소</p>
                      <p className="font-semibold text-ink">{selectedParticipation.users?.address || '-'}</p>
                    </div>
                    <div className="bg-highlight rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">인스타그램</p>
                      <p className="font-semibold text-ink">@{selectedParticipation.users?.instagram || '-'}</p>
                    </div>
                    <div className="bg-highlight rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">팔로워 수</p>
                      <p className="font-semibold text-ink">{selectedParticipation.apply_data?.followers ? Number(selectedParticipation.apply_data.followers).toLocaleString() + '명' : '-'}</p>
                    </div>
                    <div className="bg-highlight rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">원고료</p>
                      <p className="font-semibold text-ink">{selectedParticipation.apply_data?.reward || '-'}</p>
                    </div>
                    <div className="bg-highlight rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">은행/계좌</p>
                      <p className="font-semibold text-ink">{payout(selectedParticipation).bank_name || '-'} {payout(selectedParticipation).account_number || ''}</p>
                    </div>
                    <div className="bg-highlight rounded-xl p-3">
                      <p className="text-xs text-muted mb-1">정산 상태</p>
                      <p className={`font-semibold ${selectedParticipation.status === '정산완료' ? 'text-ink' : 'text-muted'}`}>
                        {selectedParticipation.status === '정산완료' ? '지급완료' : '대기중'}
                      </p>
                    </div>
                  </div>

                  {/* 제출 파일 */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-muted mb-3">제출 파일</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: '신분증', key: 'id_card_path' },
                        { label: '통장사본', key: 'bank_book_path' },
                      ].map(({ label, key }) => {
                        const path = payout(selectedParticipation)[key]
                        return (
                          <div key={key} className="bg-highlight rounded-xl p-3">
                            <p className="text-xs text-muted mb-1">{label}</p>
                            {path
                              ? <FileLink path={path} className="text-ink hover:underline text-sm font-semibold">보기</FileLink>
                              : <p className="text-muted text-sm">미제출</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 콘텐츠 파일 */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-muted mb-3">콘텐츠 파일</p>
                    <div className="grid grid-cols-1 gap-3">
                      {/* 클린본 */}
                      <div className="bg-highlight border border-line rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-bold text-ink">클린본</p>
                          {selectedParticipation.submit_data?.clean_file_url
                            ? <span className="text-xs bg-highlight text-ink px-2 py-1 rounded-full">제출됨</span>
                            : <span className="text-xs bg-highlight text-muted px-2 py-1 rounded-full">미제출</span>}
                        </div>
                        {selectedParticipation.submit_data?.clean_file_url
                          ? <FileLink path={selectedParticipation.submit_data.clean_file_url}
                              className="text-ink hover:underline text-sm font-semibold">파일 다운로드</FileLink>
                          : <p className="text-muted text-sm">아직 제출되지 않았습니다.</p>}
                      </div>
                      {/* 최종본 */}
                      <div className="bg-highlight border border-line rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-bold text-ink">최종본</p>
                          {selectedParticipation.submit_data?.final_file_url
                            ? <span className="text-xs bg-highlight text-ink px-2 py-1 rounded-full">제출됨</span>
                            : <span className="text-xs bg-highlight text-muted px-2 py-1 rounded-full">미제출</span>}
                        </div>
                        {selectedParticipation.submit_data?.final_file_url
                          ? <FileLink path={selectedParticipation.submit_data.final_file_url}
                              className="text-ink hover:underline text-sm font-semibold">파일 다운로드</FileLink>
                          : <p className="text-muted text-sm">아직 제출되지 않았습니다.</p>}
                      </div>
                      {/* 업로드 URL */}
                      {selectedParticipation.submit_data?.upload_url && (
                        <div className="bg-highlight border border-line rounded-xl p-4">
                          <p className="text-sm font-bold text-ink mb-1">업로드 URL</p>
                          <a href={selectedParticipation.submit_data.upload_url} target="_blank" rel="noreferrer"
                            className="text-ink hover:underline text-sm">{selectedParticipation.submit_data.upload_url}</a>
                        </div>
                      )}
                      {/* 서명 계약서 */}
                      {selectedParticipation.submit_data?.signed_contract_url && (
                        <div className="bg-highlight border border-line rounded-xl p-4">
                          <p className="text-sm font-bold text-ink mb-2">서명된 계약서</p>
                          <FileLink path={selectedParticipation.submit_data.signed_contract_url}
                            className="text-ink hover:underline text-sm font-semibold">계약서 보기</FileLink>
                        </div>
                      )}
                    </div>
                  </div>




                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow p-10 text-center">
                  <p className="text-muted">왼쪽에서 인플루언서를 선택해주세요.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 캠페인 요청 탭 */}
        {tab === 'requests' && (
          <div>
            <h2 className="text-lg font-bold text-ink mb-4">캠페인 요청 목록</h2>
            <div className="grid gap-4">
              {campaignRequests.map(r => (
                <div key={r.id} className="bg-white rounded-2xl shadow p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-ink text-lg">{r.product_name}</p>
                      <p className="text-sm text-muted">{r.clients?.company_name || '-'}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${requestStatusColor(r.status)}`}>{r.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div><p className="text-muted">월 버짓</p><p className="font-bold text-ink">{r.monthly_budget ? Number(r.monthly_budget).toLocaleString() + '원' : '-'}</p></div>
                    <div><p className="text-muted">제품 가격</p><p className="font-semibold">{r.product_price ? Number(r.product_price).toLocaleString() + '원' : '-'}</p></div>
                    <div><p className="text-muted">최소 인플루언서</p><p className="font-semibold">{r.min_influencers}명</p></div>
                    <div><p className="text-muted">요청일</p><p className="font-semibold">{new Date(r.created_at).toLocaleDateString('ko-KR')}</p></div>
                    <div className="col-span-2"><p className="text-muted">제품 URL</p>
                      {r.product_url ? <a href={r.product_url} target="_blank" rel="noreferrer" className="text-ink hover:underline">{r.product_url}</a> : <p>-</p>}
                    </div>
                  </div>
                  {r.status === '요청' && (
                    <div className="flex gap-3">
                      <button onClick={() => handleRequestApprove(r.id)} className="flex-1 bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">승인</button>
                      <button onClick={() => handleRequestReject(r.id)} className="flex-1 bg-ink text-white py-2 rounded-xl font-semibold hover:opacity-90 transition">거절</button>
                    </div>
                  )}
                  {r.rejection_reason && (
                    <div className="mt-3 bg-highlight border border-line rounded-xl p-3">
                      <p className="text-sm text-ink"><span className="font-semibold">거절 사유:</span> {r.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ))}
              {campaignRequests.length === 0 && <p className="text-center text-muted py-10">캠페인 요청이 없습니다.</p>}
            </div>
          </div>
        )}

        {/* 광고주 목록 탭 */}
        {tab === 'clients' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-ink">광고주 목록</h2>
              {!invite && <button onClick={() => { setInvite({ company_name: '', name: '', email: '', phone: '', homepage: '' }); setInviteMsg('') }} className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition">광고주 초대</button>}
            </div>
            <p role="status" className="text-sm text-ink mb-4">{inviteMsg}</p>
            {invite && (
              <form onSubmit={handleInvite} className="bg-white rounded-2xl shadow p-5 mb-6 grid sm:grid-cols-2 gap-3 text-sm">
                {[['company_name', '회사명 *', 'text', true], ['name', '담당자 이름', 'text'], ['email', '담당자 이메일 *', 'email', true], ['phone', '연락처', 'tel'], ['homepage', '홈페이지', 'url']].map(([k, label, type, req]) => (
                  <label key={k} className="flex flex-col gap-1 text-muted font-semibold">{label}
                    <input type={type} required={req} value={invite[k]} onChange={e => setInvite({ ...invite, [k]: e.target.value })} className="border border-line rounded-xl px-3 py-2 text-ink font-normal" />
                  </label>
                ))}
                <p className="sm:col-span-2 text-xs text-muted">담당자가 메일의 링크로 비밀번호를 정하면 광고주 대시보드를 쓸 수 있습니다. 사업자 정보는 광고주가 마이페이지에서 입력합니다.</p>
                <div className="sm:col-span-2 flex gap-2 justify-end">
                  <button type="button" onClick={() => setInvite(null)} className="px-4 py-2 rounded-xl border border-line font-semibold">취소</button>
                  <button type="submit" disabled={inviteMsg === '보내는 중...'} className="bg-ink text-white px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50">초대 메일 보내기</button>
                </div>
              </form>
            )}
            <div className="grid gap-4">
              {clients.map(c => (
                <div key={c.id} className="bg-white rounded-2xl shadow p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-ink text-lg">{c.company_name}</p>
                      <p className="text-sm text-muted">{c.email}</p>
                    </div>
                    <span className="bg-highlight text-ink text-xs px-3 py-1 rounded-full font-semibold">{signedIn[c.user_id] ? '사용 중' : '초대됨'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div><p className="text-muted">월 예산</p><p className="font-semibold">{c.monthly_budget ? c.monthly_budget.toLocaleString() + '원' : '-'}</p></div>
                    <div><p className="text-muted">제품명</p><p className="font-semibold">{c.product_name || '-'}</p></div>
                    <div><p className="text-muted">홈페이지</p>
                      {c.homepage ? <a href={c.homepage} target="_blank" rel="noreferrer" className="text-ink hover:underline font-semibold">{c.homepage}</a> : <p>-</p>}
                    </div>
                    <div><p className="text-muted">사업자등록증</p>
                      {c.business_reg_url ? <span className="text-ink font-semibold">업로드됨</span> : <span className="text-muted">미업로드</span>}
                    </div>
                  </div>
                </div>
              ))}
              {clients.length === 0 && <p className="text-center text-muted py-10">등록된 광고주가 없습니다.</p>}
            </div>
          </div>
        )}

        {tab === 'agencydb' && (
          <div>
            <h2 className="text-lg font-bold text-ink mb-4">광고주 DB</h2>
            {!selectedAgency ? (
              <div className="grid gap-4">
                {agencies.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl shadow p-5 cursor-pointer hover:shadow-sm hover:border-line border-2 border-transparent transition" onClick={() => { setSelectedAgency(a); router.push({ pathname: '/admin/dashboard', query: { tab: 'agencydb', agency: a.id } }, undefined, { shallow: true }) }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-ink text-lg">{a.company_name}</p>
                        <p className="text-sm text-muted">{a.industry} · 시작일: {a.start_date}</p>
                      </div>
                      <span className="bg-highlight text-ink text-xs px-3 py-1 rounded-full font-semibold">클릭하여 보기 →</span>
                    </div>
                  </div>
                ))}
                {agencies.length === 0 && <p className="text-center text-muted py-10">등록된 광고주가 없습니다.</p>}
              </div>
            ) : (
              <div>
                <button onClick={() => { setSelectedAgency(null); router.push({ pathname: '/admin/dashboard', query: { tab: 'agencydb' } }, undefined, { shallow: true }) }} className="mb-4 text-ink hover:underline text-sm font-semibold">← 광고주 목록으로</button>
                <h3 className="text-xl font-black text-ink mb-2">{selectedAgency.company_name}</h3>
                <p className="text-sm text-muted mb-6">{selectedAgency.industry} · 시작일: {selectedAgency.start_date}</p>
                <div className="bg-white rounded-2xl shadow overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-highlight text-ink">
                      <tr>
                        <th className="px-4 py-3 text-left">이름</th>
                        <th className="px-4 py-3 text-left">연락처</th>
                        <th className="px-4 py-3 text-left">주소</th>
                        <th className="px-4 py-3 text-left">인스타그램</th>
                        <th className="px-4 py-3 text-left">단가</th>
                        <th className="px-4 py-3 text-left">업로드 일정</th>
                        <th className="px-4 py-3 text-left">계약서</th>
                        <th className="px-4 py-3 text-left">은행/계좌</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agencyInfluencers.map((inf, i) => (
                        <tr key={inf.id} className={i % 2 === 0 ? 'bg-white' : 'bg-highlight'}>
                          <td className="px-4 py-3 font-semibold text-ink">{inf.name}</td>
                          <td className="px-4 py-3 text-muted">{inf.phone}</td>
                          <td className="px-4 py-3 text-muted text-xs max-w-xs">{inf.address || '-'}</td>
                          <td className="px-4 py-3">
                            {inf.instagram_url ? <a href={inf.instagram_url} target="_blank" rel="noreferrer" className="text-ink hover:underline">링크</a> : '-'}
                          </td>
                          <td className="px-4 py-3 text-ink font-semibold">{inf.unit_price ? `${inf.unit_price}만원` : '-'}</td>
                          <td className="px-4 py-3 text-muted">{
                            inf.upload_schedule
                              ? inf.upload_schedule.includes('00:00:00')
                                ? new Date(inf.upload_schedule).toLocaleDateString('ko-KR', {month: 'long', day: 'numeric'})
                                : inf.upload_schedule
                              : '-'
                          }</td>
                          <td className="px-4 py-3">{inf.contract === 'O' ? '' : '-'}</td>
                          <td className="px-4 py-3 text-muted text-xs">{inf.bank_info || '-'}</td>
                        </tr>
                      ))}
                      {agencyInfluencers.length === 0 && (
                        <tr><td colSpan={8} className="text-center text-muted py-10">데이터가 없습니다.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 정산 관리 탭 */}
        {tab === 'payments' && (() => {
          const table = (rows, done) => (
            <div className="bg-white rounded-2xl shadow overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-muted border-b border-line">
                  <tr>{['이름', '캠페인', '원고료', '은행', '계좌', '예금주', ''].map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map(p => (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-semibold text-ink">{p.users?.name || '-'}</td>
                      <td className="px-4 py-3 text-muted">{p.campaigns?.name || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{p.apply_data?.reward || '-'}</td>
                      <td className="px-4 py-3">{payout(p).bank_name || '-'}</td>
                      <td className="px-4 py-3 font-mono">{payout(p).account_number || '-'}</td>
                      <td className="px-4 py-3">{payout(p).account_holder || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {done ? <span className="text-xs text-muted">완료</span> : (
                          <button onClick={() => handlePaymentUpdate(p.id)} className="bg-ink text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition">정산 완료</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          const pending = participations.filter(p => p.status === '정산요청')
          const done = participations.filter(p => p.status === '정산완료')
          return (
            <div>
              <h2 className="text-lg font-bold text-ink mb-4">정산 필요 <span className="text-muted font-normal">{pending.length}건</span></h2>
              {pending.length ? table(pending, false) : <p className="bg-white rounded-2xl shadow p-10 text-center text-muted">정산할 내역이 없습니다.</p>}
              {done.length > 0 && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-semibold text-muted mb-3">정산 완료 내역 {done.length}건</summary>
                  {table(done, true)}
                </details>
              )}
            </div>
          )
        })()}

        {/* 컨설팅 신청 탭 */}
        {tab === 'consultations' && (
          <div>
            <h2 className="text-lg font-bold text-ink mb-4">컨설팅 신청 목록</h2>
            <div className="grid gap-4">
              {consultations.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-10 text-center text-muted">
                  <p>컨설팅 신청 내역이 없습니다.</p>
                </div>
              ) : (
                consultations.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl shadow p-6">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-muted">{new Date(c.created_at).toLocaleString('ko-KR')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-2">
                      <div>
                        <p className="text-xs text-muted">담당자</p>
                        <p className="font-bold text-ink">{c.manager_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">직함/직위</p>
                        <p className="text-ink">{c.job_title || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">전화번호</p>
                        <p className="text-ink">{c.phone_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">SNS URL</p>
                        <p className="text-ink text-sm break-all">{c.sns_url || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">홈페이지</p>
                        <p className="text-ink text-sm break-all">{c.website_url || '-'}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-muted">문의 내용</p>
                      <p className="text-ink mt-1 bg-highlight rounded-xl p-3">{c.inquiry_message || '-'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {/* 파일 뷰어 모달 */}
      {imageModal && (() => {
        const url = imageModal.url || ''
        const ext = (imageModal.path || url).split('?')[0].split('.').pop().toLowerCase()
        const isImage = ['jpg','jpeg','png','gif','webp','heic','heif'].includes(ext)
        const isPdf = ext === 'pdf'
        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setImageModal(null)}>
            <div className="bg-white rounded-2xl shadow-sm max-w-3xl w-full p-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-ink">{imageModal.title}</p>
                <div className="flex items-center gap-3">
                  <a href={url} target="_blank" rel="noreferrer"
                    className="text-xs text-ink underline hover:text-ink">새 탭에서 열기</a>
                  <a href={imageModal.downloadUrl || url}
                    className="text-xs text-ink underline hover:text-ink">다운로드</a>
                  <button onClick={() => setImageModal(null)}
                    className="text-muted hover:text-ink text-2xl font-bold leading-none">×</button>
                </div>
              </div>
              {isImage && (
                <img src={url} alt={imageModal.title}
                  className="w-full rounded-xl object-contain max-h-[70vh]" />
              )}
              {isPdf && (
                <iframe src={url} className="w-full rounded-xl" style={{height: '70vh'}} />
              )}
              {!isImage && !isPdf && (
                <div className="text-center py-16 text-muted">
                  <p className="text-4xl mb-4"></p>
                  <p className="font-semibold mb-2">{imageModal.title}</p>
                  <p className="text-sm text-muted mb-6">브라우저에서 미리보기가 지원되지 않는 파일입니다.</p>
                  <a href={imageModal.downloadUrl || url}
                    className="bg-ink text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition">
                    파일 다운로드
                  </a>
                </div>
              )}
            </div>
          </div>
        )
      })()}
      <Footer />
    </div>
  )
}

