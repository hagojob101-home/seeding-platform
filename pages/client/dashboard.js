import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [clientInfo, setClientInfo] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login'); return }
      setUser(user)

      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (userData?.role === 'admin') {
        setIsAdmin(true)
        router.push('/admin/dashboard')
        return
      }

      const { data: clientData } = await supabase.from('clients').select('*').eq('user_id', user.id).single()
      setClientInfo(clientData)

      const { data: c } = await supabase.from('campaigns').select('*').eq('client_id', user.id).order('created_at', { ascending: false })
      setCampaigns(c || [])

      if (c && c.length > 0) {
        const campaignIds = c.map(camp => camp.id)
        const { data: p } = await supabase
          .from('participations')
          .select('*, campaigns(*), users(*)')
          .in('campaign_id', campaignIds)
          .order('created_at', { ascending: false })
        setParticipations(p || [])
      }

      setLoading(false)
    }
    init()
  }, [])

  const totalBudget = clientInfo?.monthly_budget || 0
  const usedBudget = participations
    .filter(p => p.status === '승인' || p.status === '제품발송' || p.status === '콘텐츠확인' || p.status === '완료')
    .reduce((sum, p) => {
      const reward = p.apply_data?.reward || '0'
      const num = parseInt(String(reward).replace(/[^0-9]/g, '')) || 0
      return sum + num
    }, 0)
  const budgetPercent = totalBudget > 0 ? Math.min(Math.round((usedBudget / totalBudget) * 100), 100) : 0

  const handleShipment = async (participationId) => {
    await supabase.from('participations').update({ status: '제품발송' }).eq('id', participationId)
    const campaignIds = campaigns.map(c => c.id)
    const { data: p } = await supabase
      .from('participations')
      .select('*, campaigns(*), users(*)')
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false })
    setParticipations(p || [])
  }

  const statusColor = (status) => {
    const map = {
      '신청': 'bg-yellow-100 text-yellow-700',
      '승인': 'bg-blue-100 text-blue-700',
      '제품발송': 'bg-purple-100 text-purple-700',
      '콘텐츠확인': 'bg-orange-100 text-orange-700',
      '완료': 'bg-green-100 text-green-700',
      '거절': 'bg-red-100 text-red-700',
    }
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

        {/* 버짓 현황 */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4">💰 월 버짓 현황</h2>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>사용: <span className="font-bold text-purple-700">{usedBudget.toLocaleString()}원</span></span>
            <span>총 버짓: <span className="font-bold">{totalBudget.toLocaleString()}원</span></span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
            <div
              className={`h-4 rounded-full transition-all ${budgetPercent >= 90 ? 'bg-red-500' : budgetPercent >= 70 ? 'bg-orange-400' : 'bg-purple-500'}`}
              style={{ width: budgetPercent + '%' }}
            />
          </div>
          <p className="text-right text-sm font-bold text-gray-600">{budgetPercent}% 소진</p>
        </div>

        {/* 제품 정보 */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4">📦 제품 정보</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-400">제품명</p><p className="font-semibold">{clientInfo?.product_name || '-'}</p></div>
            <div><p className="text-gray-400">제품 가격</p><p className="font-semibold">{clientInfo?.product_price ? Number(clientInfo.product_price).toLocaleString() + '원' : '-'}</p></div>
            <div><p className="text-gray-400">최소 인플루언서 수</p><p className="font-semibold">{clientInfo?.min_influencers || '-'}명</p></div>
            <div><p className="text-gray-400">제품 URL</p>
              {clientInfo?.product_url ? (
                <a href={clientInfo.product_url} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline font-semibold">링크 보기</a>
              ) : <p className="font-semibold">-</p>}
            </div>
          </div>
        </div>

        {/* 인플루언서 현황 */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4">👥 인플루언서 현황</h2>
          {participations.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">아직 매칭된 인플루언서가 없습니다. 관리자가 곧 매칭해드릴게요!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600">인플루언서</th>
                    <th className="px-4 py-3 text-left text-gray-600">캠페인</th>
                    <th className="px-4 py-3 text-left text-gray-600">팔로워</th>
                    <th className="px-4 py-3 text-left text-gray-600">원고료</th>
                    <th className="px-4 py-3 text-left text-gray-600">상태</th>
                    <th className="px-4 py-3 text-left text-gray-600">제품발송</th>
                  </tr>
                </thead>
                <tbody>
                  {participations.map(p => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{p.apply_data?.name || p.users?.name || '-'}</p>
                        <p className="text-xs text-gray-400">{p.apply_data?.instagram || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.campaigns?.name || '-'}</td>
                      <td className="px-4 py-3">{p.apply_data?.followers ? Number(p.apply_data.followers).toLocaleString() : '-'}</td>
                      <td className="px-4 py-3 font-semibold text-purple-600">{p.apply_data?.reward || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {p.status === '승인' && (
                          <button
                            onClick={() => handleShipment(p.id)}
                            className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-purple-700 transition"
                          >
                            📦 발송완료
                          </button>
                        )}
                        {p.status === '제품발송' && <span className="text-xs text-purple-500 font-semibold">발송완료</span>}
                        {p.status === '콘텐츠확인' && <span className="text-xs text-orange-500 font-semibold">콘텐츠검토중</span>}
                        {p.status === '완료' && <span className="text-xs text-green-500 font-semibold">✅ 완료</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
