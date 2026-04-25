import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientDashboard() {
  const router = useRouter()
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('전체')

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
    const { data } = await supabase.from('participations').select('*, campaigns(*), users(*)')
    setParticipations(data || [])
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

  const statusColor = { '신청': 'bg-yellow-100 text-yellow-700', '계약': 'bg-blue-100 text-blue-700', '발송': 'bg-orange-100 text-orange-700', '수령': 'bg-purple-100 text-purple-700', '업로드': 'bg-green-100 text-green-700', '완료': 'bg-gray-100 text-gray-700' }

  const filtered = filter === '전체' ? participations : participations.filter(p => p.status === filter)

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>로딩 중...</p></div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📊 시딩 관리 대시보드</h1>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {['전체', '발송', '업로드', '완료'].map(s => (
            <div key={s} onClick={() => setFilter(s)} className={\`bg-white rounded-xl p-4 text-center cursor-pointer shadow-sm hover:shadow-md transition \${filter === s ? 'ring-2 ring-purple-500' : ''}\`}>
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
                  <td className="px-4 py-3">
                    <span className={\`px-2 py-1 rounded-full text-xs font-semibold \${statusColor[p.status] || 'bg-gray-100'}\`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">{p.upload_link ? <a href={p.upload_link} target="_blank" rel="noreferrer" className="text-blue-500 underline">링크</a> : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={\`text-xs px-2 py-1 rounded-full \${p.payment_status === '지급완료' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>{p.payment_status || '미지급'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {p.status === '계약' && <button onClick={() => updateStatus(p.id, '발송')} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">발송완료</button>}
                      {p.status === '업로드' && <button onClick={() => updateStatus(p.id, '완료')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">업로드확인</button>}
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
    </div>
  )
}
