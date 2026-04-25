import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function InfluencerLogin() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (loginError) { setError(loginError.message); setLoading(false); return }
    router.push('/influencer/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-purple-700">인플루언서 로그인</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className="border rounded-xl px-4 py-3" placeholder="이메일" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="border rounded-xl px-4 py-3" placeholder="비밀번호" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" disabled={loading} className="bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">계정이 없으신가요? <a href="/influencer/register" className="text-purple-600 font-semibold">회원가입</a></p>
      </div>
    </div>
  )
}
