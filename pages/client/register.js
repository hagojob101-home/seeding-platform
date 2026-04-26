import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientRegister() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', company_name: '', homepage: '' })
  const [businessFile, setBusinessFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (authError) throw authError

      let businessRegUrl = null
      if (businessFile) {
        const ext = businessFile.name.split('.').pop()
        const filename = 'business/' + authData.user.id + '.' + ext
        const { error: uploadError } = await supabase.storage
          .from('influencer-files')
          .upload(filename, businessFile)
        if (!uploadError) businessRegUrl = filename
      }

      await supabase.from('clients').insert({
        user_id: authData.user.id,
        email: form.email,
        company_name: form.company_name,
        homepage: form.homepage,
        business_reg_url: businessRegUrl,
      })

      await supabase.from('users').insert({
        id: authData.user.id,
        email: form.email,
        role: 'client',
      })

      alert('회원가입이 완료되었습니다!')
      router.push('/client/login')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">고객사 회원가입</h1>
        <p className="text-sm text-gray-400 mb-6">시딩 플랫폼 고객사 계정을 만들어보세요</p>
        {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일 <span className="text-red-500">*</span></label>
            <input required type="email" placeholder="company@example.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 <span className="text-red-500">*</span></label>
            <input required type="password" placeholder="6자 이상" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회사명 <span className="text-red-500">*</span></label>
            <input required placeholder="주식회사 예시" value={form.company_name}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사업자등록증 <span className="text-gray-400 text-xs">(선택 - 나중에 마이페이지에서 등록 가능)</span>
            </label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setBusinessFile(e.target.files[0])}
              className="w-full border rounded-xl px-4 py-3" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          이미 계정이 있으신가요?{' '}
          <a href="/client/login" className="text-blue-600 font-semibold hover:underline">로그인</a>
        </p>
      </div>
    </div>
  )
}
