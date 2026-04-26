import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function Apply() {
  const router = useRouter()
  const { campaign_id } = router.query
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [form, setForm] = useState({
    adult_verified: false,
    ad_consent: false,
    followers: '',
    drink_habit: '',
    premium_drink: '',
  })
  const [reward, setReward] = useState('')

  useEffect(() => {
    if (!campaign_id) return
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/influencer/login'); return }
      setUser(user)

      // 프로필 불러오기
      const { data: profileData } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(profileData)

      // 프로필 완성 여부 확인
      if (!profileData?.name || !profileData?.phone || !profileData?.address ||
          !profileData?.instagram || !profileData?.bank_name || !profileData?.account_number ||
          !profileData?.id_card_url || !profileData?.bank_book_url) {
        setProfileIncomplete(true)
      }

      // 캠페인 불러오기
      const { data: campaignData } = await supabase.from('campaigns').select('*').eq('id', campaign_id).single()
      setCampaign(campaignData)
      setLoading(false)
    }
    init()
  }, [campaign_id])

  const calcReward = (followers) => {
    const f = parseInt(followers) || 0
    if (f >= 30000) return '300,000원'
    if (f >= 10000) return '150,000원'
    return '50,000원'
  }

  const handleFollowersChange = (val) => {
    setForm({...form, followers: val})
    setReward(calcReward(val))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.adult_verified) { alert('성인 인증에 동의해주세요.'); return }
    if (!form.ad_consent) { alert('광고 동의에 체크해주세요.'); return }
    if (!form.followers) { alert('팔로워 수를 입력해주세요.'); return }
    if (profileIncomplete) { alert('마이페이지에서 기본 정보를 먼저 입력해주세요!'); router.push('/influencer/mypage'); return }

    setSubmitting(true)
    try {
      const rewardVal = calcReward(form.followers)
      const applyData = {
        // 마이페이지에서 불러온 정보
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        instagram: profile.instagram,
        youtube: profile.youtube,
        bank_name: profile.bank_name,
        account_number: profile.account_number,
        account_holder: profile.account_holder,
        resident_number: profile.resident_number,
        id_card_url: profile.id_card_url,
        bank_book_url: profile.bank_book_url,
        // 캠페인별 입력 정보
        followers: form.followers,
        reward: rewardVal,
        adult_verified: form.adult_verified,
        ad_consent: form.ad_consent,
        drink_habit: form.drink_habit,
        premium_drink: form.premium_drink,
      }

      const { error } = await supabase.from('participations').insert({
        campaign_id,
        influencer_id: user.id,
        status: '신청',
        apply_data: applyData,
        follower_count: parseInt(form.followers),
        fee: rewardVal.replace(/,/g, '').replace('원', ''),
      })

      if (error) throw error
      alert('캠페인 신청이 완료되었습니다!')
      router.push('/influencer/dashboard')
    } catch (err) {
      alert('오류: ' + err.message)
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/campaigns')}
            className="text-gray-400 hover:text-purple-600 text-sm">← 캠페인 목록</button>
          <h1 className="text-lg font-bold text-purple-700">캠페인 신청</h1>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* 프로필 미완성 경고 */}
        {profileIncomplete && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-sm font-bold text-red-700">⚠️ 기본 정보를 먼저 입력해주세요!</p>
            <p className="text-xs text-red-500 mt-1 mb-3">신청 전 마이페이지에서 정보를 완성해주세요.</p>
            <button onClick={() => router.push('/influencer/mypage')}
              className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600">
              마이페이지로 이동 →
            </button>
          </div>
        )}

        {/* 캠페인 정보 */}
        {campaign && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">{campaign.name}</h2>
                <p className="text-sm text-gray-500">{campaign.product_name}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${campaign.form_type === 'liquor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {campaign.form_type === 'liquor' ? '🍶 주류' : '📋 일반'}
              </span>
            </div>
          </div>
        )}

        {/* 내 프로필 정보 확인 */}
        {profile && !profileIncomplete && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-bold text-purple-700">👤 내 정보 확인</p>
              <button onClick={() => router.push('/influencer/mypage')}
                className="text-xs text-purple-500 hover:underline">수정하기 →</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400">이름:</span> <span className="font-semibold">{profile.name}</span></div>
              <div><span className="text-gray-400">연락처:</span> <span className="font-semibold">{profile.phone}</span></div>
              <div><span className="text-gray-400">인스타:</span> <span className="font-semibold">@{profile.instagram}</span></div>
              <div><span className="text-gray-400">은행:</span> <span className="font-semibold">{profile.bank_name}</span></div>
              <div className="col-span-2"><span className="text-gray-400">주소:</span> <span className="font-semibold">{profile.address}</span></div>
            </div>
          </div>
        )}

        {/* 신청 폼 */}
        <div className="bg-white rounded-2xl shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 팔로워 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                인스타그램 팔로워 수 <span className="text-red-500">*</span>
              </label>
              <input type="number" value={form.followers}
                onChange={e => handleFollowersChange(e.target.value)}
                placeholder="예: 15000" required
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300" />
              {reward && (
                <div className="mt-2 bg-purple-50 rounded-xl px-4 py-2">
                  <p className="text-sm text-purple-700">원고료: <span className="font-bold text-lg">{reward}</span></p>
                </div>
              )}
            </div>

            {/* 주류 캠페인 추가 필드 */}
            {campaign?.form_type === 'liquor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">음주 습관 <span className="text-red-500">*</span></label>
                  <select value={form.drink_habit} onChange={e => setForm({...form, drink_habit: e.target.value})} required
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300">
                    <option value="">선택해주세요</option>
                    <option value="주 1회 미만">주 1회 미만</option>
                    <option value="주 1~2회">주 1~2회</option>
                    <option value="주 3회 이상">주 3회 이상</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">선호 프리미엄 주류 <span className="text-red-500">*</span></label>
                  <input value={form.premium_drink} onChange={e => setForm({...form, premium_drink: e.target.value})}
                    placeholder="예: 위스키, 와인 등" required
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </>
            )}

            {/* 동의 항목 */}
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.adult_verified}
                  onChange={e => setForm({...form, adult_verified: e.target.checked})}
                  className="mt-1 w-4 h-4 accent-purple-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold text-purple-700">[필수]</span> 본인은 만 19세 이상 성인임을 확인합니다.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.ad_consent}
                  onChange={e => setForm({...form, ad_consent: e.target.checked})}
                  className="mt-1 w-4 h-4 accent-purple-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold text-purple-700">[필수]</span> 광고 콘텐츠 제작 및 게시에 동의합니다.
                </span>
              </label>
            </div>

            <button type="submit" disabled={submitting || profileIncomplete}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50">
              {submitting ? '신청 중...' : '캠페인 신청하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
