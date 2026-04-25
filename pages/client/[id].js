import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function CampaignDetail() {
  const router = useRouter()
  const { id } = router.query
  const [campaign, setCampaign] = useState(null)
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: camp } = await supabase.from('campaigns').select('*').eq('id', id).single()
    setCampaign(camp)
    const { data: parts } = await supabase.from('participations').select('*, users(*)').eq('campaign_id', id)
    setParticipations(parts || [])
    setLoading(false)
  }

  const updateStatus = async (partId, status) => {
    await supabase.from('participations').update({ status }).eq('id', partId)
    fetchData()
  }

  const updatePayment = async (partId, payment_status) => {
    await supabase.from('participations').update({ payment_status }).eq('id', partId)
    fetchData()
  }

  const statusColor = { '신청': 'bg-yellow-100 text-yellow-700', '계약': 'bg-blue-100 text-blue-700', '발송': 'bg-orange-100 text-orange-700', '수령': 'bg-purple-100 text-purple-700', '업로드': 'bg-green-100 text-green-700', '완료': 'bg-gray-100 text-gray-700' }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>로딩 중...</p></div>
  if (!campaign) return <div className="min-h-screen flex items-center justify-center"><p>캠페인을 찾을 수 없습니다.</p></div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/client/dashboard')} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">← 대시보드로 돌아가기</button>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{campaign.name}</h1>
              <p className="text-gray-500">제품: {campaign.product_name}</p>
              {campaign.description && <p className="text-gray-400 text-sm mt-2">{campaign.description}</p>}
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{campaign.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {['전체', '신청', '업로드', '완료'].map(s => (
            <div key={s} className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-purple-600">{s === '전체' ? participations.length : participations.filter(p => p.status === s).length}</p>
              <p className="text-sm text-gray-500">{s}</p>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-bold text-gray-700 mb-3">참여 인플루언서</h2>
        {participations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">아직 신청한 인플루언서가 없습니다.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">이름</th>
                  <th className="px-4 py-3 text-left">인스타</th>
                  <th className="px-4 py-3 text-left">상태</th>
                  <th className="px-4 py-3 text-left">업로드 링크</th>
                  <th className="px-4 py-3 text-left">원고료</th>
                  <th className="px-4 py-3 text-left">액션</th>
                </tr>
              </thead>
              <tbody>
                {participations.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.users?.name}</td>
                    <td className="px-4 py-3 text-purple-600">@{p.users?.insta_id}</td>
                    <td className="px-4 py-3"><span className={statusColor[p.status] + ' px-2 py-1 rounded-full text-xs font-semibold'}>{p.status}</span></td>
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
          </div>
        )}
      </div>
    </div>
  )
}
