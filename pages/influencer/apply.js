import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function Apply() {
  const router = useRouter()
  const { campaign_id } = router.query
  const [loading, setLoading] = useState(false)
  const [fetchingCampaign, setFetchingCampaign] = useState(true)
  const [campaign, setCampaign] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    is_adult: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    instagram: '',
    youtube: '',
    drink_habit: '',
    premium_drink: '',
    agree_ad: false,
    bank_name: '',
    bank_account: '',
  })
  const [idFile, setIdFile] = useState(null)
  const [bankFile, setBankFile] = useState(null)

  useEffect(() => {
    if (!campaign_id) return
    const fetchCampaign = async () => {
      const { data } = await supabase.from('campaigns').select('*').eq('id', campaign_id).single()
      setCampaign(data)
      setFetchingCampaign(false)
    }
    fetchCampaign()
  }, [campaign_id])

  const isLiquorCampaign = campaign?.form_type === 'liquor'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.is_adult !== '예') {
      setError('성인(만 19세 이상)만 신청 가능합니다.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/influencer/login'); return }

      const { data: existing } = await supabase
        .from('participations')
        .select('id')
        .eq('influencer_id', user.id)
        .eq('campaign_id', campaign_id)
        .single()
      if (existing) {
        setError('이미 신청한 캠페인입니다.')
        setLoading(false)
        return
      }

      let id_file_url = ''
      let bank_file_url = ''

      if (idFile) {
        const { data, error: upErr } = await supabase.storage
          .from('documents')
          .upload(user.id + '/id_' + Date.now(), idFile)
        if (upErr) throw upErr
        id_file_url = data.path
      }
      if (bankFile) {
        const { data, error: upErr } = await supabase.storage
          .from('documents')
          .upload(user.id + '/bank_' + Date.now(), bankFile)
        if (upErr) throw upErr
        bank_file_url = data.path
      }

      const submitData = {
        is_adult: form.is_adult,
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        instagram: form.instagram,
        youtube: form.youtube,
        agree_ad: form.agree_ad,
        bank_name: form.bank_name,
        bank_account: form.bank_account,
        id_file_url,
        bank_file_url,
      }
      if (isLiquorCampaign) {
        submitData.drink_habit = form.drink_habit
        submitData.premium_drink = form.premium_drink
      }

      const { error: insertError } = await supabase.from('participations').insert({
        influencer_id: user.id,
        campaign_id: campaign_id,
        status: '신청',
        apply_data: submitData,
      })
      if (insertError) throw insertError

      alert('신청이 완료되었습니다!')
      router.push('/influencer/dashboard')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (fetchingCampaign) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-purple-700 mb-2">{campaign?.name || '캠페인 신청'}</h1>
          <p className="text-gray-500 text-sm">{campaign?.description || ''}</p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-xl">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">만 19세 이상이신가요? (성인 인증) *</label>
            <select className="w-full border rounded-xl px-4 py-3 text-gray-700" value={form.is_adult} onChange={e => setForm({...form, is_adult: e.target.value})} required>
              <option value="">선택해주세요</option>
              <option value="예">예</option>
              <option value="아니오">아니오</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">이름 *</label>
            <input className="w-full border rounded-xl px-4 py-3" placeholder="실명 입력" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">주소 *</label>
            <input className="w-full border rounded-xl px-4 py-3" placeholder="배송 받을 주소" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">연락처 *</label>
            <input className="w-full border rounded-xl px-4 py-3" placeholder="010-0000-0000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">이메일 *</label>
            <input className="w-full border rounded-xl px-4 py-3" type="email" placeholder="이메일 주소" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">인스타그램 계정</label>
            <input className="w-full border rounded-xl px-4 py-3" placeholder="@아이디 (없으면 공백)" value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">유튜브 채널</label>
            <input className="w-full border rounded-xl px-4 py-3" placeholder="채널 URL (없으면 공백)" value={form.youtube} onChange={e => setForm({...form, youtube: e.target.value})} />
          </div>

          {isLiquorCampaign && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">평소 주류 소비 성향을 가장 잘 설명하는 항목을 선택해주세요. *</label>
                <select className="w-full border rounded-xl px-4 py-3 text-gray-700" value={form.drink_habit} onChange={e => setForm({...form, drink_habit: e.target.value})} required>
                  <option value="">선택해주세요</option>
                  <option value="거의 마시지 않음">거의 마시지 않음</option>
                  <option value="월 1-2회 가볍게">월 1-2회 가볍게</option>
                  <option value="주 1-2회 즐기는 편">주 1-2회 즐기는 편</option>
                  <option value="주 3회 이상 자주 마심">주 3회 이상 자주 마심</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">프리미엄 주류(위스키, 증류주, 꿀술 등)를 즐겨 드시는 편인가요? *</label>
                <select className="w-full border rounded-xl px-4 py-3 text-gray-700" value={form.premium_drink} onChange={e => setForm({...form, premium_drink: e.target.value})} required>
                  <option value="">선택해주세요</option>
                  <option value="예, 자주 즐깁니다">예, 자주 즐깁니다</option>
                  <option value="가끔 즐기는 편">가끔 즐기는 편</option>
                  <option value="거의 마시지 않음">거의 마시지 않음</option>
                  <option value="처음 접해보고 싶음">처음 접해보고 싶음</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">신분증 사본 업로드 *</label>
            <input type="file" accept="image/*,.pdf" className="w-full border rounded-xl px-4 py-3" onChange={e => setIdFile(e.target.files[0])} required />
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF 가능 / 개인정보는 안전하게 보관됩니다</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">통장 사본 업로드 *</label>
            <input type="file" accept="image/*,.pdf" className="w-full border rounded-xl px-4 py-3" onChange={e => setBankFile(e.target.files[0])} required />
            <p className="text-xs text-gray-400 mt-1">입금을 위한 통장 사본이 필요합니다</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">부계정 광고 동의</label>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="agree_ad" checked={form.agree_ad} onChange={e => setForm({...form, agree_ad: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="agree_ad" className="text-sm text-gray-600">부계정을 통한 추가 광고 집행에 동의합니다 (선택)</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">은행명 *</label>
            <input className="w-full border rounded-xl px-4 py-3" placeholder="예: 국민은행, 신한은행" value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">계좌번호 *</label>
            <input className="w-full border rounded-xl px-4 py-3" placeholder="계좌번호 입력 (- 없이)" value={form.bank_account} onChange={e => setForm({...form, bank_account: e.target.value})} required />
          </div>

          <button type="submit" disabled={loading} className="bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition mt-2">
            {loading ? '제출 중...' : '신청하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
