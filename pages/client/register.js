import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientRegister() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    company_name: '',
    homepage: '',
  })
  const [bizFile, setBizFile] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { role: 'client', company_name: form.company_name } }
      })
      if (signUpError) throw signUpError

      let business_reg_url = ''
      if (bizFile && data.user) {
        const { data: uploadData, error: upErr } = await supabase.storage
          .from('documents')
          .upload(data.user.id + '/biz_reg_' + Date.now(), bizFile)
        if (upErr) throw upErr
        business_reg_url = uploadData.path
      }

      if (data.user) {
        const { error: insertError } = await supabase.from('clients').insert({
          user_id: data.user.id,
          email: form.email,
          company_name: form.company_name,
          homepage: form.homepage,
          business_reg_url,
        })
        if (insertError) throw insertError

        await supabase.from('users').insert({
          id: data.user.id,
          email: form.email,
          name: form.company_name,
          role: 'client',
        })
      }

      alert('회원가입이 완료되었습니다! 로그인해주세요.')
      router.push('/client/login')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🏢</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">고객사 회원가입</h1>
          <p className="text-gray-500 text-sm">시딩 플랫폼 파트너로 등록해주세요</p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-xl">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">계정 정보</p>
            <div className="flex flex-col gap-3">
              <input
                className="border rounded-xl px-4 py-3"
                placeholder="이메일 *"
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required
              />
              <input
                className="border rounded-xl px-4 py-3"
                placeholder="비밀번호 * (6자리 이상)"
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">회사 정보</p>
            <div className="flex flex-col gap-3">
              <input
                className="border rounded-xl px-4 py-3"
                placeholder="회사명 *"
                value={form.company_name}
                onChange={e => setForm({...form, company_name: e.target.value})}
                required
              />
              <input
                className="border rounded-xl px-4 py-3"
                placeholder="홈페이지 URL (예: https://company.com)"
                value={form.homepage}
                onChange={e => setForm({...form, homepage: e.target.value})}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">사업자등록증 업로드 *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full border rounded-xl px-4 py-3"
                  onChange={e => setBizFile(e.target.files[0])}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF 가능</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-700 transition mt-2"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          이미 계정이 있으신가요?{' '}
          <a href="/client/login" className="text-gray-800 font-semibold hover:underline">로그인</a>
        </p>
      </div>
    </div>
  )
}
