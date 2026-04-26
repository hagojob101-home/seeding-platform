import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function InfluencerMypage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [idFile, setIdFile] = useState(null)
  const [bankFile, setBankFile] = useState(null)
  const [form, setForm] = useState({
    name: '', phone: '', address: '',
    instagram: '', youtube: '',
    bank_name: '', account_number: '', account_holder: '',
    resident_number: '',
  })
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/influencer/login'); return }
      setUser(user)
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(data)
      if (data) {
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          instagram: data.instagram || '',
          youtube: data.youtube || '',
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_holder: data.account_holder || '',
          resident_number: data.resident_number || '',
        })
      }
      setLoading(false)
    }
    init()
  }, [])

  const uploadFile = async (file, folder) => {
    if (!file) return null
    const ext = file.name.split('.').pop()
    const filename = folder + '/' + user.id + '_' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('influencer-files').upload(filename, file)
    if (error) throw error
    return filename
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let idCardUrl = profile?.id_card_url
      let bankBookUrl = profile?.bank_book_url

      if (idFile) idCardUrl = await uploadFile(idFile, 'id-cards')
      if (bankFile) bankBookUrl = await uploadFile(bankFile, 'bank-books')

      const { error } = await supabase.from('users').update({
        name: form.name,
        phone: form.phone,
        address: form.address,
        instagram: form.instagram,
        youtube: form.youtube,
        bank_name: form.bank_name,
        account_number: form.account_number,
        account_holder: form.account_holder,
        resident_number: form.resident_number,
        id_card_url: idCardUrl,
        bank_book_url: bankBookUrl,
      }).eq('id', user.id)

      if (error) throw error
      alert('저장되었습니다!')
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(data)
    } catch (err) {
      alert('오류: ' + err.message)
    }
    setSaving(false)
  }

  const isProfileComplete = () => {
    return profile?.name && profile?.phone && profile?.address &&
           profile?.instagram && profile?.bank_name &&
           profile?.account_number && profile?.id_card_url && profile?.bank_book_url
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
          <button onClick={() => router.push('/influencer/dashboard')}
            className="text-gray-400 hover:text-purple-600 text-sm">← 대시보드</button>
          <h1 className="text-lg font-bold text-purple-700">마이페이지</h1>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/influencer/login') }}
          className="text-sm text-gray-500 hover:text-red-500">로그아웃</button>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-8">
        {!isProfileComplete() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <p className="text-sm font-bold text-yellow-700">⚠️ 프로필을 완성해주세요!</p>
            <p className="text-xs text-yellow-600 mt-1">캠페인 신청을 위해 기본 정보를 먼저 입력해주세요.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="mb-6 pb-4 border-b">
            <p className="text-sm text-gray-400 mb-1">로그인 계정</p>
            <p className="font-bold text-gray-800">{user?.email}</p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* 기본 정보 */}
            <div>
              <p className="text-sm font-bold text-purple-700 mb-3">📋 기본 정보</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="실명 입력" required
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연락처 <span className="text-red-500">*</span></label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="010-0000-0000" required
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">주소 <span className="text-red-500">*</span></label>
                  <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                    placeholder="배송받을 주소 입력" required
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">주민등록번호</label>
                  <input value={form.resident_number} onChange={e => setForm({...form, resident_number: e.target.value})}
                    placeholder="000000-0000000"
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
            </div>

            {/* SNS 정보 */}
            <div>
              <p className="text-sm font-bold text-purple-700 mb-3">📱 SNS 정보</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">인스타그램 아이디 <span className="text-red-500">*</span></label>
                  <div className="flex items-center border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-purple-300">
                    <span className="text-gray-400 mr-1">@</span>
                    <input value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})}
                      placeholder="instagram_id"
                      className="flex-1 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유튜브 채널</label>
                  <input value={form.youtube} onChange={e => setForm({...form, youtube: e.target.value})}
                    placeholder="채널명 또는 URL"
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
            </div>

            {/* 정산 정보 */}
            <div>
              <p className="text-sm font-bold text-purple-700 mb-3">🏦 정산 정보</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">은행명 <span className="text-red-500">*</span></label>
                  <input value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})}
                    placeholder="예: 국민은행"
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호 <span className="text-red-500">*</span></label>
                  <input value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})}
                    placeholder="계좌번호 입력 (- 없이)"
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                  <input value={form.account_holder} onChange={e => setForm({...form, account_holder: e.target.value})}
                    placeholder="예금주명"
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
            </div>

            {/* 파일 업로드 */}
            <div>
              <p className="text-sm font-bold text-purple-700 mb-3">📎 서류 업로드</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신분증 사본 <span className="text-red-500">*</span></label>
                  {profile?.id_card_url && (
                    <p className="text-xs text-green-600 font-semibold mb-1">✅ 업로드됨 (새 파일 선택 시 교체)</p>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setIdFile(e.target.files[0])}
                    className="w-full border rounded-xl px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">통장 사본 <span className="text-red-500">*</span></label>
                  {profile?.bank_book_url && (
                    <p className="text-xs text-green-600 font-semibold mb-1">✅ 업로드됨 (새 파일 선택 시 교체)</p>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setBankFile(e.target.files[0])}
                    className="w-full border rounded-xl px-4 py-3" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50">
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
