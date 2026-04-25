import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function InfluencerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/influencer/login'); return }
      setUser(user)
      const { data: profileData } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const { data: parts } = await supabase.from('participations').select('*, campaigns(*)').eq('influencer_id', user.id)
      setParticipations(parts || [])
      setLoading(false)
    }
    getUser()
  }, [])

  const getFee = (followers) => {
    if (followers <= 10000) return 50000
    if (followers <= 30000) return 150000
    return 300000
  }

  const statusSteps = ['신청', '계약', '발송', '수령', '업로드', '완료']

  const handleUpload = async (id, link) => {
    await supabase.from('participations').update({ upload_link: link, status: '업로드' }).eq('id', id)
    const { data } = await supabase.from('participations').select('*, campaigns(*)').eq('influencer_id', user.id)
    setParticipations(data || [])
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>로딩 중...</p></div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-purple-700 mb-1">안녕하세요, {profile?.name}님! 👋</h1>
          <p className="text-gray-500">@{profile?.insta_id}</p>
        </div>

        <div className="bg-purple-50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-purple-700 mb-3">💰 원고료 안내</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-sm text-gray-500">~1만 팔로워</p>
              <p className="text-xl font-bold text-purple-600">5만원</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-sm text-gray-500">1만~3만 팔로워</p>
              <p className="text-xl font-bold text-purple-600">15만원</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-sm text-gray-500">3만~10만 팔로워</p>
              <p className="text-xl font-bold text-purple-600">30만원</p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-700 mb-3">📋 참여 캠페인</h2>
        {participations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            <p>아직 참여 중인 캠페인이 없습니다.</p>
          </div>
        ) : participations.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow p-6 mb-4">
            <h3 className="font-bold text-lg mb-2">{p.campaigns?.name}</h3>
            <p className="text-gray-500 text-sm mb-4">제품: {p.campaigns?.product_name}</p>
            <div className="flex gap-2 mb-4 flex-wrap">
              {statusSteps.map((step, i) => (
                <span key={i} className={\`px-3 py-1 rounded-full text-xs font-semibold \${p.status === step ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}\`}>
                  {step}
                </span>
              ))}
            </div>
            {p.status === '수령' && (
              <div className="flex gap-2 mt-2">
                <input
                  className="border rounded-xl px-3 py-2 flex-1 text-sm"
                  placeholder="업로드한 릴스/쇼츠 링크 입력"
                  onBlur={(e) => handleUpload(p.id, e.target.value)}
                />
                <button className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm">제출</button>
              </div>
            )}
            {p.upload_link && <p className="text-sm text-blue-500 mt-2">업로드 링크: <a href={p.upload_link} target="_blank" rel="noreferrer">{p.upload_link}</a></p>}
          </div>
        ))}

        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="mt-4 text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
      </div>
    </div>
  )
}
