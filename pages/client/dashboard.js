import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

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
      const { data: rData } = await supabase
        .from('campaign_requests')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      setRequests(rData || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleSubmitRequest = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('campaign_requests').insert({
      client_id: user.id,
      company_name: clientInfo?.company_name || '',
      monthly_budget: parseInt(form.monthly_budget),
      product_url: form.product_url,
      product_name: form.product_name,
      product_price: parseInt(form.product_price),
      min_influencers: parseInt(form.min_influencers),
      status: '검토중'
    })
    if (error) { alert('오류: ' + error.message); return }
    alert('캠페인 요청이 제출되었습니다!')
    setShowForm(false)
    const { data: rData } = await supabase
      .from('campaign_requests')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
    setRequests(rData || [])
  }

  const statusBadge = (status) => {
    const map = {
      '검토중': 'bg-yellow-100 text-yellow-700',
      '승인': 'bg-green-100 text-green-700',
      '거절': 'bg-red-100 text-red-700'
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  const approved = requests.filter(r => r.status === '승인')
  const pending = requests.filter(r => r.status === '검토중')
  const rejected = requests.filter(r => r.status === '거절')

  const menuItems = [
    { id: 'home', label: '🏠 홈' },
    { id: 'request', label: '📋 캠페인 요청하기' },
    { id: 'approved', label: '✅ 승인된 캠페인', count: approved.length },
    { id: 'pending', label: '⏳ 검토중', count: pending.length },
    { id: 'rejected', label: '❌ 거절됨', count: rejected.length },
    { id: 'mypage', label: '👤 마이페이지' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <aside className="w-56 bg-white shadow-md flex flex-col py-6 px-3 min-h-screen">
        <div className="mb-8 px-3">
          <h1 className="text-lg font-bold text-blue-700">고객사 포털</h1>
          <p className="text-xs text-gray-400 mt-1">{clientInfo?.company_name}</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-between text-left px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              <span>{item.label}</span>
              {item.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === item.id ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'
                }`}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/client/login') }}
          className="mt-4 px-3 py-2 text-sm text-red-400 hover:text-red-600 text-left"
        >
          로그아웃
        </button>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-8">

        {/* 홈 탭 */}
        {activeTab === 'home' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              안녕하세요, {clientInfo?.company_name}님! 👋
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl shadow p-6 text-center">
                <p className="text-3xl font-bold text-blue-600">{requests.length}</p>
                <p className="text-sm text-gray-500 mt-1">전체 요청</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-6 text-center">
                <p className="text-3xl font-bold text-green-600">{approved.length}</p>
                <p className="text-sm text-gray-500 mt-1">승인된 캠페인</p>
              </div>
              <div className="bg-white rounded-2xl shadow p-6 text-center">
                <p className="text-3xl font-bold text-yellow-600">{pending.length}</p>
                <p className="text-sm text-gray-500 mt-1">검토중</p>
              </div>
            </div>
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center">
                <p className="text-gray-400 mb-4">아직 요청한 캠페인이 없습니다.</p>
                <button
                  onClick={() => setActiveTab('request')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
                >
                  + 첫 캠페인 요청하기
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="font-bold text-gray-700 mb-4">최근 캠페인 요청</h3>
                <div className="flex flex-col gap-3">
                  {requests.slice(0, 3).map(r => (
                    <div key={r.id} className="flex justify-between items-center py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">{r.product_name}</p>
                        <p className="text-xs text-gray-400">버짓: {r.monthly_budget?.toLocaleString()}원</p>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">캠페인 요청하기</h2>
            <div className="bg-white rounded-2xl shadow p-8 max-w-xl">
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품명</label>
                  <input required placeholder="예: 참이슬 오리지널" value={form.product_name}
                    onChange={e => setForm({...form, product_name: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품 URL</label>
                  <input required placeholder="https://..." value={form.product_url}
                    onChange={e => setForm({...form, product_url: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품 가격 (원)</label>
                  <input required type="number" placeholder="예: 15000" value={form.product_price}
                    onChange={e => setForm({...form, product_price: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">1개월 버짓 (원)</label>
                  <input required type="number" placeholder="예: 3000000" value={form.monthly_budget}
                    onChange={e => setForm({...form, monthly_budget: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">최소 인플루언서 수</label>
                  <input required type="number" placeholder="예: 10" value={form.min_influencers}
                    onChange={e => setForm({...form, min_influencers: e.target.value})}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <button type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                  요청 제출
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 승인된 캠페인 탭 */}
        {activeTab === 'approved' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">✅ 승인된 캠페인</h2>
            {approved.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                승인된 캠페인이 없습니다.
              </div>
            ) : (
              <div className="grid gap-4">
                {approved.map(r => (
                  <div key={r.id}
                    className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition"
                    onClick={() => r.campaign_id && router.push('/client/' + r.campaign_id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{r.product_name}</h3>
                        <p className="text-sm text-gray-500">
                          버짓: {r.monthly_budget?.toLocaleString()}원 · 최소 {r.min_influencers}명
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-100 text-green-700">승인</span>
                    </div>
                    <p className="text-sm text-gray-600">제품가: {r.product_price?.toLocaleString()}원</p>
                    {r.product_url && (
                      <a href={r.product_url} target="_blank" rel="noreferrer"
                        className="text-blue-500 underline text-xs" onClick={e => e.stopPropagation()}>
                        {r.product_url}
                      </a>
                    )}
                    <div className="mt-3 text-right">
                      <span className="text-xs text-blue-500 font-semibold">인플루언서 리스트 보기 →</span>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">⏳ 검토중인 캠페인</h2>
            {pending.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                검토중인 캠페인이 없습니다.
              </div>
            ) : (
              <div className="grid gap-4">
                {pending.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl shadow p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{r.product_name}</h3>
                        <p className="text-sm text-gray-500">
                          버짓: {r.monthly_budget?.toLocaleString()}원 · 최소 {r.min_influencers}명
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-700">검토중</span>
                    </div>
                    <p className="text-sm text-gray-600">제품가: {r.product_price?.toLocaleString()}원</p>
                    <p className="text-xs text-gray-400 mt-2">관리자 검토 후 승인됩니다.</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 거절됨 탭 */}
        {activeTab === 'rejected' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">❌ 거절된 캠페인</h2>
            {rejected.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                거절된 캠페인이 없습니다.
              </div>
            ) : (
              <div className="grid gap-4">
                {rejected.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl shadow p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{r.product_name}</h3>
                        <p className="text-sm text-gray-500">
                          버짓: {r.monthly_budget?.toLocaleString()}원
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-red-100 text-red-700">거절</span>
                    </div>
                    {r.rejection_reason && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-600">
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 마이페이지</h2>
            <div className="bg-white rounded-2xl shadow p-8 max-w-xl">
              <div className="mb-6 pb-4 border-b">
                <p className="text-sm text-gray-400 mb-1">로그인 계정</p>
                <p className="font-bold text-gray-800">{clientInfo?.email}</p>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">회사명</p>
                  <p className="font-semibold text-gray-800">{clientInfo?.company_name || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">홈페이지</p>
                  {clientInfo?.homepage
                    ? <a href={clientInfo.homepage} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold">{clientInfo.homepage}</a>
                    : <p className="text-gray-400">미등록</p>}
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">사업자등록번호</p>
                  <p className="font-semibold text-gray-800">{clientInfo?.business_reg_number || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">사업자등록증</p>
                  {clientInfo?.business_reg_url
                    ? <span className="text-green-600 font-semibold">✅ 등록됨</span>
                    : <span className="text-orange-400 font-semibold">⚠️ 미등록</span>}
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">세금계산서 이메일</p>
                  <p className="font-semibold text-gray-800">{clientInfo?.tax_email || '-'}</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/client/mypage')}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                ✏️ 정보 수정하기
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
