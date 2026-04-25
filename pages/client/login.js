import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientLogin() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">고객사 / 관리자 로그인</h2>
          <p className="text-gray-500 text-sm">시딩 플랫폼</p>
        </div>
        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-xl">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className="border rounded-xl px-4 py-3" placeholder="이메일" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="border rounded-xl px-4 py-3" placeholder="비밀번호" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" disabled={loading} className="bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          고객사 계정이 없으신가요?{' '}
          <a href="/client/register" className="text-gray-800 font-semibold hover:underline">회원가입</a>
        </p>
      </div>
    </div>
  )
}
