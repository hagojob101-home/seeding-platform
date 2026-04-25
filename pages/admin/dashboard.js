import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function AdminDashboard() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState([])
  const [participations, setParticipations] = useState([])
  const [clients, setClients] = useState([])
  const [tab, setTab] = useState('campaigns')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    product_name: '',
    description: '',
    reward: '',
    deadline: '',
    form_type: 'basic',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login'); return }
      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (userData?.role !== 'admin') { router.push('/client/dashboard'); return }
      await fetchData()
      setLoading(false)
    }
    init()
  }, [])

  const fetchData = async () => {
    const { data: c } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
    setCampaigns(c || [])
    const { data: p } = await supabase.from('participations').select('*, campaigns(name), users(name, instagram)').order('created_at', { ascending: false })
    setParticipations(p || [])
    const { data: cl } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(cl || [])
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('campaigns').insert(newCampaign)
    if (error) { alert('오류: ' + error.message); return }
    alert('캠페인이 등록되었습니다!')
    setShowForm(false)
    setNewCampaign({ name: '', product_name: '', description: '', reward: '', deadline: '', form_type: 'basic' })
    fetchData()
  }

  const handleStatusUpdate = async (id, status) => {
    await supabase.from('participations').update({ status }).eq('id', id)
    fetchData()
  }

  const handlePaymentUpdate = async (id) => {
    await supabase.from('participations').update({ payment_status: '지급완료' }).eq('id', id)
    fetchData()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-700">관리자 대시보드</h1>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/client/login') }} className="text-sm text-gray-500 hover:text-red-500">로그아웃</button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab('campaigns')} className={`px-6 py-2 rounded-xl font-semibold transition ${tab === 'campaigns' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border'}`}>캠페인 관리</button>
          <button onClick={() => setTab('participations')} className={`px-6 py-2 rounded-xl font-semibold transition ${tab === 'participations' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border'}`}>참여 현황</button>
          <button onClick={() => setTab('clients')} className={`px-6 py-2 rounded-xl font-semibold transition ${tab === 'clients' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border'}`}>고객사 목록</button>
        </div>

        {tab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">캠페인 목록</h2>
              <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
                {showForm ? '닫기' : '+ 새 캠페인 등록'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleCreateCampaign} className="bg-white rounded-2xl shadow p-6 mb-6 flex flex-col gap-4">
                <h3 className="font-bold text-gray-700">새 캠페인 등록</h3>
                <input className="border rounded-xl px-4 py-3" placeholder="캠페인 이름 *" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} required />
                <input className="border rounded-xl px-4 py-3" placeholder="제품명 *" value={newCampaign.product_name} onChange={e => setNewCampaign({...newCampaign, product_name: e.target.value})} required />
                <textarea className="border rounded-xl px-4 py-3" placeholder="캠페인 설명" rows={3} value={newCampaign.description} onChange={e => setNewCampaign({...newCampaign, description: e.target.value})} />
                <input className="border rounded-xl px-4 py-3" type="date" placeholder="마감일" value={newCampaign.deadline} onChange={e => setNewCampaign({...newCampaign, deadline: e.target.value})} />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">신청 폼 타입 *</label>
                  <select className="w-full border rounded-xl px-4 py-3 text-gray-700" value={newCampaign.form_type} onChange={e => setNewCampaign({...newCampaign, form_type: e.target.value})} required>
                    <option value="basic">기본 폼 (일반 캠페인)</option>
                    <option value="liquor">주류 폼 (주류 소비 성향 항목 포함)</option>
                  </select>
                </div>
                <button type="submit" className="bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition">등록하기</button>
              </form>
            )}

            <div className="grid gap-4">
              {campaigns.map(c => (
                <div key={c.id} onClick={() => router.push('/client/' + c.id)} className="bg-white rounded-2xl shadow p-5 cursor-pointer hover:shadow-md transition flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.product_name} · {c.deadline ? '마감: ' + c.deadline : '마감일 미설정'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${c.form_type === 'liquor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.form_type === 'liquor' ? '🍶 주류 폼' : '📋 기본 폼'}
                    </span>
                    <span className="text-purple-600 text-sm font-semibold">상세보기 →</span>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && <p className="text-center text-gray-400 py-10">등록된 캠페인이 없습니다.</p>}
            </div>
          </div>
        )}

        {tab === 'participations' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">참여 현황</h2>
            <div className="bg-white rounded-2xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600">인플루언서</th>
                    <th className="px-4 py-3 text-left text-gray-600">캠페인</th>
                    <th className="px-4 py-3 text-left text-gray-600">상태</th>
                    <th className="px-4 py-3 text-left text-gray-600">정산</th>
                    <th className="px-4 py-3 text-left text-gray-600">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {participations.map(p => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.users?.name || '-'}<br/><span className="text-xs text-gray-400">{p.users?.instagram || ''}</span></td>
                      <td className="px-4 py-3 text-purple-600 cursor-pointer hover:underline" onClick={() => router.push('/client/' + p.campaign_id)}>{p.campaigns?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <select value={p.status} onChange={e => handleStatusUpdate(p.id, e.target.value)} className="border rounded-lg px-2 py-1 text-xs">
                          <option>신청</option>
                          <option>승인</option>
                          <option>제품발송</option>
                          <option>콘텐츠확인</option>
                          <option>완료</option>
                          <option>거절</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${p.payment_status === '지급완료' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.payment_status || '미지급'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.payment_status !== '지급완료' && (
                          <button onClick={() => handlePaymentUpdate(p.id)} className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition">지급완료</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {participations.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">참여 내역이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                    <div><p className="text-gray-400">제품명</p><p className="font-semibold">{c.product_name}</p></div>
                    <div><p className="text-gray-400">제품 가격</p><p className="font-semibold">{c.product_price ? Number(c.product_price).toLocaleString() + '원' : '-'}</p></div>
                    <div><p className="text-gray-400">월 버짓</p><p className="font-bold text-purple-600">{c.monthly_budget ? Number(c.monthly_budget).toLocaleString() + '원' : '-'}</p></div>
                    <div><p className="text-gray-400">최소 인플루언서</p><p className="font-semibold">{c.min_influencers}명</p></div>
                    <div className="col-span-2"><p className="text-gray-400">제품 URL</p>
                      {c.product_url ? <a href={c.product_url} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline font-semibold">{c.product_url}</a> : <p>-</p>}
                    </div>
                  </div>
                </div>
              ))}
              {clients.length === 0 && <p className="text-center text-gray-400 py-10">등록된 고객사가 없습니다.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
