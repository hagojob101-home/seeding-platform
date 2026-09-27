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
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (loginError) { setError(loginError.message); setLoading(false); return }
    if (data?.user?.user_metadata?.must_change_password) {
      router.push('/influencer/change-password')
      return
    }
    router.push('/influencer/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-highlight ">
      <div className="fixed top-4 left-4 flex gap-2">
        <button onClick={() => router.push('/')} className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition">
          053 Meta
        </button>
        <button onClick={() => router.push('/login')} className="bg-white text-ink px-4 py-2 rounded-xl text-sm font-semibold hover:bg-highlight transition border border-line">
          시딩 플랫폼
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-ink">인플루언서 로그인</h2>
        {error && <p className="text-ink text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className="border rounded-xl px-4 py-3" placeholder="이메일" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="border rounded-xl px-4 py-3" placeholder="비밀번호" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" disabled={loading} className="bg-ink text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-sm mt-4"><a href="/forgot-password" className="text-muted hover:underline">비밀번호를 잊으셨나요?</a></p>
        <p className="text-center text-sm text-muted mt-4">계정이 없으신가요? <a href="/influencer/register" className="text-ink font-semibold">회원가입</a></p>
      </div>
    </div>
  )
}
