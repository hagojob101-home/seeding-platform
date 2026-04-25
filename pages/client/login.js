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
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (loginError) { setError(loginError.message); setLoading(false); return }
    const { data: userData } = await supabase.from('users').select('role').eq('id', data.user.id).single()
    if (!userData || (userData.role !== 'client' && userData.role !== 'admin')) {
      setError('고객사/관리자 계정이 아닙니다.')
      setLoading(false)
      return
    }
    router.push('/client/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">고객사 / 관리자 로그인</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className="border rounded-xl px-4 py-3" placeholder="이메일" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="border rounded-xl px-4 py-3" placeholder="비밀번호" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" disabled={loading} className="bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
