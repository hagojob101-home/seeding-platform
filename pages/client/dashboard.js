import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import Footer from '../../components/Footer'

const BUDGET_MAX = 10000000
const budgetLabel = v => v >= BUDGET_MAX ? '1천만원 이상' : v ? (v / 10000).toLocaleString() + '만원' : '0원'
const INF_MAX = 100
const infLabel = v => v >= INF_MAX ? '100명 이상' : v + '명'
const num = v => v == null ? '-' : v.toLocaleString()

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
    monthly_budget: 3000000, min_influencers: 10
  })
  const [an, setAn] = useState(null) // 제품 분석: { loading } | { error, needName } | { data }
  const [showAllInf, setShowAllInf] = useState(false)

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
    if (!clientInfo) { alert('광고주 정보를 찾을 수 없습니다.'); return }
    const { error } = await supabase.from('campaigns').insert({
      client_id: clientInfo.id,
      name: form.product_name + ' 캠페인',
      description: (clientInfo.company_name || '') + ' 시딩 캠페인',
      monthly_budget: form.monthly_budget,
      product_url: form.product_url,
      product_name: form.product_name,
      product_price: parseInt(form.product_price),
      min_influencers: form.min_influencers,
      status: '요청'
    })
    if (error) { alert('오류: ' + error.message); return }
    alert('캠페인 요청이 제출되었습니다!')
    setShowForm(false)
    setRequests(await fetchCampaigns(clientInfo.id))
  }

  // 메인(simfle)과 같은 분석 API. 로그인 토큰을 보내면 관련 인플루언서 명단 전체를 받는다
  const analyzeProduct = async () => {
    const url = form.product_url.trim()
    if (!url) { setAn({ error: '제품 URL을 입력해 주세요.' }); return }
    // 페이지를 못 읽은 뒤에는 입력한 제품명으로 다시 분석
    const name = (an?.needName && form.product_name.trim()) || undefined
    setAn({ loading: true })
    setShowAllInf(false)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ url, country: 'KR', name }),
      })
      const j = await res.json()
      if (!res.ok) { setAn({ error: j.error || '분석하지 못했습니다. 잠시 후 다시 시도해 주세요.', needName: j.needName }); return }
      setAn({ data: j })
      setForm(f => ({ ...f, product_name: j.title || f.product_name, product_price: j.price ?? f.product_price }))
    } catch {
      setAn({ error: '분석하지 못했습니다. 잠시 후 다시 시도해 주세요.' })
    }
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
          <h1 className="text-lg font-bold text-ink">광고주 포털</h1>
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
                        <p className="text-xs text-muted">버짓: {budgetLabel(r.monthly_budget)}</p>
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
                  <label htmlFor="product_url" className="block text-sm font-medium text-ink mb-1">제품 URL</label>
                  <div className="flex gap-2">
                    <input id="product_url" required type="url" placeholder="https://..." value={form.product_url}
                      onChange={e => setForm({...form, product_url: e.target.value})}
                      className="flex-1 min-w-0 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ink" />
                    <button type="button" onClick={analyzeProduct} disabled={an?.loading}
                      className="shrink-0 border border-ink text-ink px-5 rounded-xl font-semibold hover:bg-ink hover:text-white transition disabled:opacity-50">
                      {an?.loading ? '분석 중…' : '분석'}
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1">분석하면 제품명·가격을 채우고, 관련 키워드와 인플루언서를 찾아드려요.</p>
                </div>

                <div aria-live="polite">
                  {an?.error && (
                    <p className="text-sm text-red-600">{an.error}{an.needName && ' 아래에 제품명을 입력하고 다시 분석을 눌러 주세요.'}</p>
                  )}
                  {an?.data && !an.data.matched && (
                    <p className="text-sm text-muted bg-bg rounded-xl p-4">관련 광고 데이터를 찾지 못했어요. 제품명·가격을 확인하고 요청을 제출해 주세요.</p>
                  )}
                  {an?.data?.matched && (() => {
                    const r = an.data
                    const list = showAllInf ? r.influencers : r.influencers.slice(0, 10)
                    return (
                      <div className="bg-bg rounded-xl p-4 space-y-4">
                        <p className="text-xs text-muted">분석 결과{r.collectedOn && ` · ${r.collectedOn} 수집 데이터 기준`}{r.similar && ' · 비슷한 키워드로 찾음'}</p>
                        <div>
                          <p className="text-xs text-muted mb-1.5">제품 키워드</p>
                          <ul className="flex flex-wrap gap-1.5">
                            {[r.keyword, ...r.matchedKeywords].map((k, i) => (
                              <li key={k} className={`text-sm px-3 py-1 rounded-full border ${i ? 'border-line text-ink' : 'bg-ink border-ink text-white'}`}>{k}</li>
                            ))}
                          </ul>
                        </div>
                        {r.related.length > 0 && (
                          <div>
                            <p className="text-xs text-muted mb-1.5">같은 카테고리{r.category && ` (${r.category})`} 키워드</p>
                            <ul className="flex flex-wrap gap-1.5">
                              {r.related.map(k => <li key={k} className="text-sm px-3 py-1 rounded-full border border-line text-ink">{k}</li>)}
                            </ul>
                          </div>
                        )}
                        <dl className="grid grid-cols-3 gap-2">
                          {[['광고 수', r.stats.ads], ['광고 계정', r.stats.accounts], ['협업 광고', r.stats.collab]].map(([k, v]) => (
                            <div key={k} className="bg-white rounded-lg px-3 py-2">
                              <dt className="text-xs text-muted">{k}</dt>
                              <dd className="font-bold text-ink">{num(v)}</dd>
                            </div>
                          ))}
                        </dl>
                        <div>
                          <p className="text-sm font-semibold text-ink mb-1.5">관련 인플루언서 <span className="text-muted font-normal">{num(r.influencers.length + r.lockedCount)}명</span></p>
                          {r.influencers.length === 0 ? <p className="text-sm text-muted">아직 찾은 인플루언서가 없어요.</p> : (
                            <table className="w-full text-sm">
                              <thead><tr className="text-xs text-muted text-left"><th className="font-normal py-1">계정</th><th className="font-normal">협업 브랜드</th><th className="font-normal text-right">팔로워</th></tr></thead>
                              <tbody>
                                {list.map(i => (
                                  <tr key={i.handle} className="border-t">
                                    <td className="py-1.5">
                                      <a href={`https://www.instagram.com/${encodeURIComponent(i.handle.replace(/^@/, ''))}/`} target="_blank" rel="noopener noreferrer" className="text-ink hover:underline">{i.handle}</a>
                                    </td>
                                    <td className="text-muted">{i.brand || '-'}</td>
                                    <td className="text-right">{num(i.followers)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {r.influencers.length > 10 && (
                            <button type="button" onClick={() => setShowAllInf(v => !v)} className="w-full mt-2 text-sm border rounded-xl py-2 hover:bg-white transition">
                              {showAllInf ? '접기' : `더 보기 (${num(r.influencers.length - 10)}명)`}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div>
                  <label htmlFor="product_name" className="block text-sm font-medium text-ink mb-1">제품명</label>
                  <input id="product_name" required placeholder="예: 참이슬 오리지널" value={form.product_name}
                    onChange={e => setForm({...form, product_name: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ink" />
                </div>
                <div>
                  <label htmlFor="product_price" className="block text-sm font-medium text-ink mb-1">제품 가격 (원)</label>
                  <input id="product_price" required type="number" min="0" placeholder="예: 15000" value={form.product_price}
                    onChange={e => setForm({...form, product_price: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ink" />
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label htmlFor="monthly_budget" className="text-sm font-medium text-ink">1개월 버짓</label>
                    <output htmlFor="monthly_budget" className="text-lg font-bold text-ink">{budgetLabel(form.monthly_budget)}</output>
                  </div>
                  <input id="monthly_budget" type="range" min="0" max={BUDGET_MAX} step="100000" value={form.monthly_budget}
                    aria-valuetext={budgetLabel(form.monthly_budget)}
                    onChange={e => setForm({...form, monthly_budget: Number(e.target.value)})}
                    className="w-full accent-ink cursor-pointer" />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>0원</span><span>500만원</span><span>1천만원 이상</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label htmlFor="min_influencers" className="text-sm font-medium text-ink">최소 인플루언서 수</label>
                    <output htmlFor="min_influencers" className="text-lg font-bold text-ink">{infLabel(form.min_influencers)}</output>
                  </div>
                  <input id="min_influencers" type="range" min="1" max={INF_MAX} step="1" value={form.min_influencers}
                    aria-valuetext={infLabel(form.min_influencers)}
                    onChange={e => setForm({...form, min_influencers: Number(e.target.value)})}
                    className="w-full accent-ink cursor-pointer" />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>1명</span><span>50명</span><span>100명 이상</span>
                  </div>
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
                          버짓: {budgetLabel(r.monthly_budget)} · 최소 {r.min_influencers}명
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
                          버짓: {budgetLabel(r.monthly_budget)} · 최소 {r.min_influencers}명
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
                          버짓: {budgetLabel(r.monthly_budget)}
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
