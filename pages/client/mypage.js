import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientMypage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [clientInfo, setClientInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [businessFile, setBusinessFile] = useState(null)
  const [sameAsLogin, setSameAsLogin] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    homepage: '',
    business_reg_number: '',
    tax_email: '',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/client/login'); return }
      setUser(user)
      const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).single()
      setClientInfo(data)
      if (data) {
        setForm({
          company_name: data.company_name || '',
          homepage: data.homepage || '',
          business_reg_number: data.business_reg_number || '',
          tax_email: data.tax_email || '',
        })
        if (data.tax_email && data.tax_email === user.email) {
          setSameAsLogin(true)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSameAsLogin = (checked) => {
    setSameAsLogin(checked)
    if (checked) {
      setForm(prev => ({ ...prev, tax_email: user.email }))
    } else {
      setForm(prev => ({ ...prev, tax_email: '' }))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let businessRegUrl = clientInfo?.business_reg_url

      if (businessFile) {
        const ext = businessFile.name.split('.').pop()
        const filename = 'business/' + user.id + '_' + Date.now() + '.' + ext
        const { error: uploadError } = await supabase.storage
          .from('influencer-files')
          .upload(filename, businessFile)
        if (!uploadError) businessRegUrl = filename
      }

      const { error } = await supabase.from('clients').update({
        company_name: form.company_name,
        homepage: form.homepage,
        business_reg_number: form.business_reg_number,
        tax_email: form.tax_email,
        business_reg_url: businessRegUrl,
      }).eq('user_id', user.id)

      if (error) throw error
      alert('저장되었습니다!')
      const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).single()
      setClientInfo(data)
    } catch (err) {
      alert('오류: ' + err.message)
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/client/dashboard')}
            className="text-gray-400 hover:text-blue-600 text-sm">← 대시보드</button>
          <h1 className="text-lg font-bold text-blue-700">마이페이지</h1>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/client/login') }}
          className="text-sm text-gray-500 hover:text-red-500">로그아웃</button>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">{clientInfo?.company_name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">회사명 <span className="text-red-500">*</span></label>
              <input required value={form.company_name}
                onChange={e => setForm({...form, company_name: e.target.value})}
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">홈페이지 URL</label>
              <input placeholder="https://example.com" value={form.homepage}
                onChange={e => setForm({...form, homepage: e.target.value})}
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록번호</label>
              <input placeholder="000-00-00000" value={form.business_reg_number}
                onChange={e => setForm({...form, business_reg_number: e.target.value})}
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록증 업로드</label>
              {clientInfo?.business_reg_url && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-green-600 text-sm font-semibold">✅ 등록됨</span>
                  <span className="text-gray-400 text-xs">새 파일 업로드 시 교체됩니다</span>
                </div>
              )}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setBusinessFile(e.target.files[0])}
                className="w-full border rounded-xl px-4 py-3" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">세금계산서 받을 이메일</label>
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" id="sameAsLogin" checked={sameAsLogin}
                  onChange={e => handleSameAsLogin(e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
                <label htmlFor="sameAsLogin" className="text-sm text-gray-600 cursor-pointer">
                  로그인 아이디와 동일 ({user?.email})
                </label>
              </div>
              <input type="email" placeholder="tax@example.com" value={form.tax_email}
                onChange={e => { setForm({...form, tax_email: e.target.value}); setSameAsLogin(false) }}
                disabled={sameAsLogin}
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 ${sameAsLogin ? 'bg-gray-50 text-gray-400' : ''}`} />
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
