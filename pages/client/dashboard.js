import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [clientInfo, setClientInfo] = useState(null)
  const [requests, setRequests] = useState([])
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    monthly_budget: '',
    product_url: '',
    product_name: '',
    product_price: '',
    min_influencers: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login'); return }
      setUser(user)
      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (userData?.role === 'admin') { router.push('/admin/dashboard'); return }
      const { data: clientData } = await supabase.from('clients').select('*').eq('user_id', user.id).single()
      setClientInfo(clientData)
      await fetchData(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const fetchData = async (uid) => {
    const { data: r } = await supabase
      .from('campaign_requests')
      .select('*')
      .eq('client_id', uid)
      .order('created_at', { ascending: false })
    setRequests(r || [])

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('client_id', uid)

    if (campaigns && campaigns.length > 0) {
      const campaignIds = campaigns.map(c => c.id)
      const { data: p } = await supabase
        .from('participations')
        .select('*, campaigns(*), users(*)')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false })
      setParticipations(p || [])
    } else {
      setParticipations([])
    }
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data: clientData } = await supabase.from('clients').select('company_name').eq('user_id', user.id).single()
      const { error } = await supabase.from('campaign_requests').insert({
        client_id: user.id,
        company_name: clientData?.company_name || '',
        monthly_budget: parseInt(requestForm.monthly_budget),
        product_url: requestForm.product_url,
        product_name: requestForm.product_name,
        product_price: parseInt(requestForm.product_price),
        min_influencers: parseInt(requestForm.min_influencers),
        status: '검토중',
      })
      if (error) throw error
      alert('캠페인 요청이 완료되었습니다! 관리자 검토 후 승인됩니다.')
      setShowRequestForm(false)
      setRequestForm({ monthly_budget: '', product_url: '', product_name: '', product_price: '', min_influencers: '' })
      await fetchData(user.id)
    } catch (err) {
      alert('오류: ' + err.message)
    }
    setSubmitting(false)
  }

  const handleShipment = async (participationId) => {
    await supabase.from('participations').update({ status: '제품발송' }).eq('id', participationId)
    await fetchData(user.id)
  }

  const steps = ['신청', '승인', '제품발송', '콘텐츠확인', '완료']

  const getStepIndex = (status) => {
    const map = { '신청': 0, '승인': 1, '제품발송': 2, '콘텐츠확인': 3, '완료': 4, '거절': -1 }
    return map[status] ?? 0
  }

  const stepIcons = ['📋', '✅', '📦', '🎬', '🏆']
  const stepLabels = ['신청', '승인', '제품발송', '콘텐츠확인', '완료']

  const approvedRequests = requests.filter(r => r.status === '승인')
  const totalBudget = approvedRequests.reduce((sum, r) => sum + (r.monthly_budget || 0), 0)
  const usedBudget = participations
    .filter(p => ['승인', '제품발송', '콘텐츠확인', '완료'].includes(p.status))
    .reduce((sum, p) => {
      const reward = p.apply_data?.reward || '0'
      const num = parseInt(String(reward).replace(/[^0-9]/g, '')) || 0
      return sum + num
    }, 0)
  const budgetPercent = totalBudget > 0 ? Math.min(Math.round((usedBudget / totalBudget) * 100), 100) : 0

  const requestStatusColor = (status) => {
    const map = { '검토중': 'bg-yellow-100 text-yellow-700', '승인': 'bg-green-100 text-green-700', '거절': 'bg-red-100 text-red-700' }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🏢 {clientInfo?.company_name || '고객사'} 대시보드</h1>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/client/login') }} className="text-sm text-gray-500 hover:text-red-500">로그아웃</button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* 캠페인 요청하기 */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">캠페인 요청 현황</h2>
          <button onClick={() => setShowRequestForm(!showRequestForm)} className="bg-gray-900 text-white px-5 py-2 rounded-xl font-semibold hover:bg-gray-700 transition">
            {showRequestForm ? '닫기' : '+ 캠페인 요청하기'}
          </button>
        </div>

        {showRequestForm && (
          <form onSubmit={handleRequestSubmit} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
            <h3 className="font-bold text-gray-700 text-lg">새 캠페인 요청</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">시딩 제품명 *</label>
              <input className="w-full border rounded-xl px-4 py-3" placeholder="예: 부즈앤버즈 꿀술" value={requestForm.product_name} onChange={e => setRequestForm({...requestForm, product_name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">제품 URL *</label>
              <input className="w-full border rounded-xl px-4 py-3" placeholder="https://..." value={requestForm.product_url} onChange={e => setRequestForm({...requestForm, product_url: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">제품 가격 *</label>
              <input className="w-full border rounded-xl px-4 py-3" type="number" placeholder="예: 50000" value={requestForm.product_price} onChange={e => setRequestForm({...requestForm, product_price: e.target.value})} required />
              {requestForm.product_price && <p className="text-xs text-purple-600 mt-1">{Number(requestForm.product_price).toLocaleString()}원</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">1개월 버짓 *</label>
              <input className="w-full border rounded-xl px-4 py-3" type="number" placeholder="예: 1000000" value={requestForm.monthly_budget} onChange={e => setRequestForm({...requestForm, monthly_budget: e.target.value})} required />
              {requestForm.monthly_budget && <p className="text-xs text-purple-600 mt-1">{Number(requestForm.monthly_budget).toLocaleString()}원</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">최소 인플루언서 수 *</label>
              <input className="w-full border rounded-xl px-4 py-3" type="number" placeholder="예: 10" value={requestForm.min_influencers} onChange={e => setRequestForm({...requestForm, min_influencers: e.target.value})} required />
            </div>
            <button type="submit" disabled={submitting} className="bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-700 transition">
              {submitting ? '요청 중...' : '요청하기'}
            </button>
          </form>
        )}

        {/* 요청 목록 */}
        <div className="flex flex-col gap-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white rounded-2xl shadow p-5 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">{r.product_name}</p>
                <p className="text-sm text-gray-500">버짓: {r.monthly_budget ? Number(r.monthly_budget).toLocaleString() + '원' : '-'} · 최소 {r.min_influencers}명</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${requestStatusColor(r.status)}`}>{r.status}</span>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
              <p className="mb-2">아직 캠페인 요청이 없습니다.</p>
              <p className="text-sm">위의 버튼을 눌러 첫 캠페인을 요청해보세요!</p>
            </div>
          )}
        </div>

        {/* 버짓 소진 현황 */}
        {approvedRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-700 mb-4">💰 버짓 소진 현황</h2>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>사용: <span className="font-bold text-purple-700">{usedBudget.toLocaleString()}원</span></span>
              <span>총 버짓: <span className="font-bold">{totalBudget.toLocaleString()}원</span></span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
              <div className={`h-4 rounded-full transition-all ${budgetPercent >= 90 ? 'bg-red-500' : budgetPercent >= 70 ? 'bg-orange-400' : 'bg-purple-500'}`} style={{ width: budgetPercent + '%' }} />
            </div>
            <p className="text-right text-sm font-bold text-gray-600">{budgetPercent}% 소진</p>
          </div>
        )}

        {/* 인플루언서 리스트 & 진행 상황 */}
        {participations.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-gray-700 mb-6">👥 인플루언서 진행 현황</h2>
            <div className="flex flex-col gap-6">
              {participations.map(p => {
                const currentStep = getStepIndex(p.status)
                const isRejected = p.status === '거절'
                return (
                  <div key={p.id} className="border rounded-2xl p-5">
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
                        <p className="text-xs text-gray-400">{p.campaigns?.name || '-'}</p>
                        {isRejected && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">거절</span>}
                      </div>
                    </div>

                    {/* 진행 상황 바 */}
                    {!isRejected && (
                      <div className="mb-5">
                        <div className="flex items-center justify-between relative">
                          {/* 연결선 */}
                          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" />
                          <div
                            className="absolute top-5 left-0 h-1 bg-green-500 z-0 transition-all"
                            style={{ width: currentStep === 0 ? '0%' : `${(currentStep / (steps.length - 1)) * 100}%` }}
                          />
                          {stepLabels.map((label, i) => (
                            <div key={i} className="flex flex-col items-center z-10">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                                i < currentStep ? 'bg-green-500 text-white' :
                                i === currentStep ? 'bg-green-500 text-white ring-4 ring-green-200' :
                                'bg-gray-200 text-gray-400'
                              }`}>
                                {i <= currentStep ? stepIcons[i] : stepIcons[i]}
                              </div>
                              <p className={`text-xs mt-2 font-semibold ${i <= currentStep ? 'text-green-600' : 'text-gray-400'}`}>{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 발송 버튼 */}
                    {p.status === '승인' && (
                      <button
                        onClick={() => handleShipment(p.id)}
                        className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition"
                      >
                        📦 제품 발송 완료
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
