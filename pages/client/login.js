import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import { useHome } from '../../lib/home'

export default function ClientLogin() {
  const router = useRouter()
  const home = useHome()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isAdmin = router.query.as === 'admin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

    if (userData?.role === 'admin') {
      router.push('/admin/dashboard')
    } else if (userData?.role === 'client') {
      router.push('/client/dashboard')
    } else {
      router.push('/client/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-highlight">
      {/* 상단 네비게이션 버튼 */}
      <div className="fixed top-4 left-4 flex gap-2">
        <button onClick={() => router.push(home.href)} className="bg-white text-ink px-4 py-2 rounded-xl text-sm font-semibold hover:bg-highlight transition border border-line">
          {home.label}
        </button>
        <button onClick={() => router.push('/login')} className="bg-white text-ink px-4 py-2 rounded-xl text-sm font-semibold hover:bg-highlight transition border border-line">
          시딩 플랫폼
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink mb-2">{isAdmin ? '관리자 로그인' : '광고주 로그인'}</h2>
          <p className="text-muted text-sm">{isAdmin ? '053 운영팀 전용' : '브랜드 담당자용'}</p>
        </div>
        {error && <p className="text-ink text-sm mb-4 text-center bg-highlight p-3 rounded-xl">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className="border rounded-xl px-4 py-3" placeholder="이메일" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="border rounded-xl px-4 py-3" placeholder="비밀번호" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" disabled={loading} className="bg-ink text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-sm mt-4"><a href="/forgot-password" className="text-muted hover:underline">비밀번호를 잊으셨나요?</a></p>
        {!isAdmin && (
        <p className="text-center text-sm text-muted mt-4">
          광고주 계정이 없으신가요? 먼저 상담 문의를 신청해주세요.{' '}
          <a href="/#apply" className="text-ink font-semibold hover:underline whitespace-nowrap">상담 신청하기</a>
        </p>
        )}
      </div>
    </div>
  )
}
