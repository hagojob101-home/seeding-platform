import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import Footer from '../../components/Footer'

export default function ClientDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [clientInfo, setClientInfo] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    product_name: '', product_url: '', product_price: '',
    monthly_budget: '', min_influencers: ''
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login'); return }
      setUser(user)
      const { data: cData } = await supabase.from('clients').select('*').eq('user_id', user.id).single()
      setClientInfo(cData)
      if (cData) setRequests(await fetchCampaigns(cData.id))
      setLoading(false)
    }
    init()
  }, [])

  const fetchCampaigns = async (clientId) => {
    const { data } = await supabase.from('campaigns').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    return data || []
  }

  // 캠페인 요청 = 상태 '요청'인 캠페인
  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    if (!clientInfo) { alert('고객사 정보를 찾을 수 없습니다.'); return }
    const { error } = await supabase.from('campaigns').insert({
      client_id: clientInfo.id,
      name: form.product_name + ' 캠페인',
      description: (clientInfo.company_name || '') + ' 시딩 캠페인',
      monthly_budget: parseInt(form.monthly_budget),
      product_url: form.product_url,
      product_name: form.product_name,
      product_price: parseInt(form.product_price),
      min_influencers: parseInt(form.min_influencers),
      status: '요청'
    })
    if (error) { alert('오류: ' + error.message); return }
    alert('캠페인 요청이 제출되었습니다!')
    setShowForm(false)
    setRequests(await fetchCampaigns(clientInfo.id))
  }

  const statusBadge = (status) => {
    const map = {
      '요청': 'bg-highlight text-ink',
      '진행': 'bg-highlight text-ink',
      '완료': 'bg-highlight text-ink',
      '거절': 'bg-highlight text-ink'
    }
    return map[status] || 'bg-highlight text-ink'
  }

  const approved = requests.filter(r => r.status === '진행' || r.status === '완료')
  const pending = requests.filter(r => r.status === '요청')
  const rejected = requests.filter(r => r.status === '거절')

  const menuItems = [
    { id: 'home', label: '홈' },
    { id: 'request', label: '캠페인 요청하기' },
    { id: 'approved', label: '승인된 캠페인', count: approved.length },
    { id: 'pending', label: '검토중', count: pending.length },
    { id: 'rejected', label: '거절됨', count: rejected.length },
    { id: 'mypage', label: '마이페이지' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-highlight flex">
      {/* 사이드바 */}
      <aside className="w-56 bg-white shadow-sm flex flex-col py-6 px-3 min-h-screen">
        <div className="mb-8 px-3">
          <h1 className="text-lg font-bold text-ink">고객사 포털</h1>
          <p className="text-xs text-muted mt-1">{clientInfo?.company_name}</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-between text-left px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === item.id
                  ? 'bg-ink text-white'
                  : 'text-muted hover:bg-highlight'
              }`}
            >
              <span>{item.label}</span>
              {item.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === item.id ? 'bg-white text-ink' : 'bg-highlight text-ink'
                }`}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/client/login') }}
          className="mt-4 px-3 py-2 text-sm text-muted hover:text-ink text-left"
        >
          로그아웃
        </button>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-8">

        {/* 홈 탭 */}
        {activeTab === 'home' && (
          <div>
            <h2 className="text-2xl font-bold text-ink mb-6">
              안녕하세요, {clientInfo?.company_name}님! 
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl shadow p-6 text-center">
                <p className="text-3xl font-bold text-ink">{requests.length}</p>
                <p className="text-sm text-muted mt-1">전체 요청</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-6 text-center">
                <p className="text-3xl font-bold text-ink">{approved.length}</p>
                <p className="text-sm text-muted mt-1">승인된 캠페인</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-6 text-center">
                <p className="text-3xl font-bold text-ink">{pending.length}</p>
                <p className="text-sm text-muted mt-1">검토중</p>
              </div>
            </div>
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center">
                <p className="text-muted mb-4">아직 요청한 캠페인이 없습니다.</p>
                <button
                  onClick={() => setActiveTab('request')}
                  className="bg-ink text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
                >
                  + 첫 캠페인 요청하기
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="font-bold text-ink mb-4">최근 캠페인 요청</h3>
                <div className="flex flex-col gap-3">
                  {requests.slice(0, 3).map(r => (
                    <div key={r.id} className="flex justify-between items-center py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium text-ink">{r.product_name}</p>
                        <p className="text-xs text-muted">버짓: {r.monthly_budget?.toLocaleString()}원</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 캠페인 요청하기 탭 */}
        {activeTab === 'request' && (
          <div>
            <h2 className="text-2xl font-bold text-ink mb-6">캠페인 요청하기</h2>
            <div className="bg-white rounded-2xl shadow p-8 max-w-xl">
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">제품명</label>
                  <input required placeholder="예: 참이슬 오리지널" value={form.product_name}
                    onChange={e => setForm({...form, product_name: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ink" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">제품 URL</label>
                  <input required placeholder="https://..." value={form.product_url}
                    onChange={e => setForm({...form, product_url: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ink" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">제품 가격 (원)</label>
                  <input required type="number" placeholder="예: 15000" value={form.product_price}
                    onChange={e => setForm({...form, product_price: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ink" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">1개월 버짓 (원)</label>
                  <input required type="number" placeholder="예: 3000000" value={form.monthly_budget}
                    onChange={e => setForm({...form, monthly_budget: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ink" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">최소 인플루언서 수</label>
                  <input required type="number" placeholder="예: 10" value={form.min_influencers}
                    onChange={e => setForm({...form, min_influencers: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ink" />
                </div>
                <button type="submit"
                  className="w-full bg-ink text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">
                  요청 제출
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 승인된 캠페인 탭 */}
        {activeTab === 'approved' && (
          <div>
            <h2 className="text-2xl font-bold text-ink mb-6">승인된 캠페인</h2>
            {approved.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-muted">
                승인된 캠페인이 없습니다.
              </div>
            ) : (
              <div className="grid gap-4">
                {approved.map(r => (
                  <div key={r.id}
                    className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-sm transition"
                    onClick={() => router.push('/client/' + r.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-ink text-lg">{r.product_name}</h3>
                        <p className="text-sm text-muted">
                          버짓: {r.monthly_budget?.toLocaleString()}원 · 최소 {r.min_influencers}명
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusBadge(r.status)}`}>{r.status}</span>
                    </div>
                    <p className="text-sm text-muted">제품가: {r.product_price?.toLocaleString()}원</p>
                    {r.product_url && (
                      <a href={r.product_url} target="_blank" rel="noreferrer"
                        className="text-ink underline text-xs" onClick={e => e.stopPropagation()}>
                        {r.product_url}
                      </a>
                    )}
                    <div className="mt-3 text-right">
                      <span className="text-xs text-ink font-semibold">인플루언서 리스트 보기 →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 검토중 탭 */}
        {activeTab === 'pending' && (
          <div>
            <h2 className="text-2xl font-bold text-ink mb-6">검토중인 캠페인</h2>
            {pending.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-muted">
                검토중인 캠페인이 없습니다.
              </div>
            ) : (
              <div className="grid gap-4">
                {pending.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl shadow p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-ink text-lg">{r.product_name}</h3>
                        <p className="text-sm text-muted">
                          버짓: {r.monthly_budget?.toLocaleString()}원 · 최소 {r.min_influencers}명
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-highlight text-ink">검토중</span>
                    </div>
                    <p className="text-sm text-muted">제품가: {r.product_price?.toLocaleString()}원</p>
                    <p className="text-xs text-muted mt-2">관리자 검토 후 승인됩니다.</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 거절됨 탭 */}
        {activeTab === 'rejected' && (
          <div>
            <h2 className="text-2xl font-bold text-ink mb-6">거절된 캠페인</h2>
            {rejected.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-muted">
                거절된 캠페인이 없습니다.
              </div>
            ) : (
              <div className="grid gap-4">
                {rejected.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl shadow p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-ink text-lg">{r.product_name}</h3>
                        <p className="text-sm text-muted">
                          버짓: {r.monthly_budget?.toLocaleString()}원
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-highlight text-ink">거절</span>
                    </div>
                    {r.rejection_reason && (
                      <div className="mt-3 bg-highlight border border-line rounded-xl p-3">
                        <p className="text-sm text-ink">
                          <span className="font-semibold">거절 사유:</span> {r.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 마이페이지 탭 */}
        {activeTab === 'mypage' && (
          <div>
            <h2 className="text-2xl font-bold text-ink mb-6">마이페이지</h2>
            <div className="bg-white rounded-2xl shadow p-8 max-w-xl">
              <div className="mb-6 pb-4 border-b">
                <p className="text-sm text-muted mb-1">로그인 계정</p>
                <p className="font-bold text-ink">{clientInfo?.email}</p>
              </div>
              <div className="space-y-4">
                <div className="bg-highlight rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">회사명</p>
                  <p className="font-semibold text-ink">{clientInfo?.company_name || '-'}</p>
                </div>
                <div className="bg-highlight rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">홈페이지</p>
                  {clientInfo?.homepage
                    ? <a href={clientInfo.homepage} target="_blank" rel="noreferrer" className="text-ink hover:underline font-semibold">{clientInfo.homepage}</a>
                    : <p className="text-muted">미등록</p>}
                </div>
                <div className="bg-highlight rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">사업자등록번호</p>
                  <p className="font-semibold text-ink">{clientInfo?.business_reg_number || '-'}</p>
                </div>
                <div className="bg-highlight rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">사업자등록증</p>
                  {clientInfo?.business_reg_url
                    ? <span className="text-ink font-semibold">등록됨</span>
                    : <span className="text-muted font-semibold">미등록</span>}
                </div>
                <div className="bg-highlight rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">세금계산서 이메일</p>
                  <p className="font-semibold text-ink">{clientInfo?.tax_email || '-'}</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/client/mypage')}
                className="w-full mt-6 bg-ink text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">
                정보 수정하기
              </button>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  )
}
