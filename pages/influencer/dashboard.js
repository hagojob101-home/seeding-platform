import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function InfluencerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [participations, setParticipations] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('내 참여')
  const [applying, setApplying] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/influencer/login'); return }
      setUser(user)
      const { data: profileData } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const { data: parts } = await supabase.from('participations').select('*, campaigns(*)').eq('influencer_id', user.id)
      setParticipations(parts || [])
      const { data: camps } = await supabase.from('campaigns').select('*').eq('status', '모집중').order('created_at', { ascending: false })
      setCampaigns(camps || [])
      setLoading(false)
    }
    getUser()
  }, [])

  const applyForCampaign = async (campaignId) => {
    const alreadyApplied = participations.some(p => p.campaign_id === campaignId)
    if (alreadyApplied) { alert('이미 신청한 캠페인입니다!'); return }
    setApplying(campaignId)
    await supabase.from('participations').insert({ influencer_id: user.id, campaign_id: campaignId, status: '신청' })
    const { data: parts } = await supabase.from('participations').select('*, campaigns(*)').eq('influencer_id', user.id)
    setParticipations(parts || [])
    setApplying(null)
    alert('신청이 완료되었습니다!')
  }

  const handleUpload = async (id, link) => {
    if (!link) return
    await supabase.from('participations').update({ upload_link: link, status: '업로드' }).eq('id', id)
    const { data } = await supabase.from('participations').select('*, campaigns(*)').eq('influencer_id', user.id)
    setParticipations(data || [])
    alert('업로드 링크가 제출되었습니다!')
  }

  const statusSteps = ['신청', '계약', '발송', '수령', '업로드', '완료']

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>로딩 중...</p></div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-purple-700 mb-1">안녕하세요, {profile?.name}님!</h1>
          <p className="text-gray-500">@{profile?.insta_id}</p>
        </div>
        <div className="flex gap-3 mb-6">
          {['내 참여', '캠페인 신청', '원고료 안내'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? 'px-4 py-2 rounded-xl font-semibold text-sm bg-purple-600 text-white' : 'px-4 py-2 rounded-xl font-semibold text-sm bg-white text-gray-600 shadow'}>{t}</button>
          ))}
        </div>
        {tab === '원고료 안내' && (
          <div className="bg-purple-50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-purple-700 mb-3">원고료 안내</h2>
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
        )}
        {tab === '캠페인 신청' && (
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-3">모집 중인 캠페인</h2>
            {campaigns.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">현재 모집 중인 캠페인이 없습니다.</div>
            ) : campaigns.map((c) => {
              const alreadyApplied = participations.some(p => p.campaign_id === c.id)
              return (
                <div key={c.id} className="bg-white rounded-2xl shadow p-6 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{c.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">제품: {c.product_name}</p>
                      {c.description && <p className="text-gray-400 text-sm mt-2">{c.description}</p>}
                    </div>
                    <button onClick={() => applyForCampaign(c.id)} disabled={alreadyApplied || applying === c.id} className={alreadyApplied ? 'px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed' : 'px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white'}>
                      {applying === c.id ? '신청 중...' : alreadyApplied ? '신청완료' : '신청하기'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {tab === '내 참여' && (
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-3">참여 캠페인</h2>
            {participations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
                <p>아직 참여 중인 캠페인이 없어요.</p>
                <button onClick={() => setTab('캠페인 신청')} className="mt-3 text-purple-600 font-semibold text-sm">캠페인 신청하러 가기</button>
              </div>
            ) : participations.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl shadow p-6 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg">{p.campaigns?.name}</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">{p.status}</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">제품: {p.campaigns?.product_name}</p>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {statusSteps.map((step, i) => (
                    <span key={i} className={p.status === step ? 'px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white' : 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-400'}>{step}</span>
                  ))}
                </div>
                {p.status === '수령' && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">업로드한 링크를 입력해주세요:</p>
                    <div className="flex gap-2">
                      <input id={"upload-" + p.id} className="border rounded-xl px-3 py-2 flex-1 text-sm" placeholder="https://www.instagram.com/reel/..." />
                      <button onClick={() => { const el = document.getElementById("upload-" + p.id); handleUpload(p.id, el.value) }} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">제출</button>
                    </div>
                  </div>
                )}
                {p.upload_link && <p className="text-sm text-blue-500 mt-2">업로드 링크: <a href={p.upload_link} target="_blank" rel="noreferrer" className="underline">{p.upload_link}</a></p>}
                {p.payment_status === '지급완료' && <p className="text-sm text-green-600 mt-2 font-semibold">원고료 지급 완료!</p>}
              </div>
            ))}
          </div>
        )}
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="mt-4 text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
      </div>
    </div>
  )
}
