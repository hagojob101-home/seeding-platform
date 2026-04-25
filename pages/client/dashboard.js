import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientDashboard() {
  const router = useRouter()
  const [participations, setParticipations] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('전체')
  const [tab, setTab] = useState('참여현황')
  const [newCampaign, setNewCampaign] = useState({ name: '', product_name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login'); return }
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (!userData || (userData.role !== 'client' && userData.role !== 'admin')) {
        router.push('/client/login'); return
      }
      fetchData()
    }
    getUser()
  }, [])

  const fetchData = async () => {
    const { data: parts } = await supabase.from('participations').select('*, campaigns(*), users(*)')
    setParticipations(parts || [])
    const { data: camps } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
    setCampaigns(camps || [])
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('participations').update({ status }).eq('id', id)
    fetchData()
  }

  const updatePayment = async (id, payment_status) => {
    await supabase.from('participations').update({ payment_status }).eq('id', id)
    fetchData()
  }

  const createCampaign = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('campaigns').insert({ ...newCampaign, status: '모집중' })
    setNewCampaign({ name: '', product_name: '', description: '' })
    setSaving(false)
    fetchData()
    alert('캠페인이 등록되었습니다!')
  }

  const statusColor = { '신청': 'bg-yellow-100 text-yellow-700', '계약': 'bg-blue-100 text-blue-700', '발송': 'bg-orange-100 text-orange-700', '수령': 'bg-purple-100 text-purple-700', '업로드': 'bg-green-100 text-green-700', '완료': 'bg-gray-100 text-gray-700' }
  const filtered = filter === '전체' ? participations : participations.filter(p => p.status === filter)

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>로딩 중...</p></div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">시딩 관리 대시보드</h1>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
        </div>
        <div className="flex gap-3 mb-6">
          {['참여현황', '캠페인관리'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={['참여현황', '캠페인관리'].indexOf(t) >= 0 && tab === t ? 'px-5 py-2 rounded-xl font-semibold text-sm bg-purple-600 text-white' : 'px-5 py-2 rounded-xl font-semibold text-sm bg-white text-gray-600 shadow'}>{t}</button>
          ))}
        </div>
        {tab === '캠페인관리' && (
          <div>
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
              <h2 className="text-lg font-bold mb-4 text-gray-700">새 캠페인 등록</h2>
              <form onSubmit={createCampaign} className="flex flex-col gap-3">
                <input className="border rounded-xl px-4 py-3" placeholder="캠페인명" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} required />
                <input className="border rounded-xl px-4 py-3" placeholder="제품명" value={newCampaign.product_name} onChange={e => setNewCampaign({...newCampaign, product_name: e.target.value})} required />
                <textarea className="border rounded-xl px-4 py-3" placeholder="캠페인 설명" rows={3} value={newCampaign.description} onChange={e => setNewCampaign({...newCampaign, description: e.target.value})} />
                <button type="submit" disabled={saving} className="bg-purple-600 text-white py-3 rounded-xl font-semibold">{saving ? '등록 중...' : '캠페인 등록'}</button>
              </form>
            </div>
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">캠페인명</th>
                    <th className="px-4 py-3 text-left">제품명</th>
                    <th className="px-4 py-3 text-left">상태</th>
                    <th className="px-4 py-3 text-left">생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">{c.product_name}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{c.status}</span></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString('ko-KR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {campaigns.length === 0 && <p className="text-center text-gray-400 py-8">등록된 캠페인이 없습니다.</p>}
            </div>
          </div>
        )}
        {tab === '참여현황' && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {['전체', '발송', '업로드', '완료'].map(s => (
                <div key={s} onClick={() => setFilter(s)} className="bg-white rounded-xl p-4 text-center cursor-pointer shadow-sm">
                  <p className="text-2xl font-bold text-purple-600">{s === '전체' ? participations.length : participations.filter(p => p.status === s).length}</p>
                  <p className="text-sm text-gray-500">{s}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">인플루언서</th>
                    <th className="px-4 py-3 text-left">인스타</th>
                    <th className="px-4 py-3 text-left">캠페인</th>
                    <th className="px-4 py-3 text-left">상태</th>
                    <th className="px-4 py-3 text-left">업로드 링크</th>
                    <th className="px-4 py-3 text-left">원고료</th>
                    <th className="px-4 py-3 text-left">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.users?.name}</td>
                      <td className="px-4 py-3 text-purple-600">@{p.users?.insta_id}</td>
                      <td className="px-4 py-3">{p.campaigns?.name}</td>
                      <td className="px-4 py-3"><span className={statusColor[p.status] || 'bg-gray-100'}>{p.status}</span></td>
                      <td className="px-4 py-3">{p.upload_link ? <a href={p.upload_link} target="_blank" rel="noreferrer" className="text-blue-500 underline">링크</a> : '-'}</td>
                      <td className="px-4 py-3"><span className={p.payment_status === '지급완료' ? 'text-xs px-2 py-1 rounded-full bg-green-100 text-green-700' : 'text-xs px-2 py-1 rounded-full bg-red-100 text-red-700'}>{p.payment_status || '미지급'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {p.status === '신청' && <button onClick={() => updateStatus(p.id, '계약')} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">계약승인</button>}
                          {p.status === '계약' && <button onClick={() => updateStatus(p.id, '발송')} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">발송완료</button>}
                          {p.status === '발송' && <button onClick={() => updateStatus(p.id, '수령')} className="bg-purple-500 text-white px-2 py-1 rounded text-xs">수령확인</button>}
                          {p.status === '업로드' && <button onClick={() => updateStatus(p.id, '완료')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">완료처리</button>}
                          {p.payment_status !== '지급완료' && <button onClick={() => updatePayment(p.id, '지급완료')} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">지급완료</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="text-center text-gray-400 py-8">데이터가 없습니다.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
