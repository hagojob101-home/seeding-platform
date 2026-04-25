import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', insta_id: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name, insta_id: form.insta_id, role: 'influencer' } }
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id, email: form.email, name: form.name,
        insta_id: form.insta_id, role: 'influencer'
      })
    }
    router.push('/influencer/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-purple-700">인플루언서 회원가입</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input className="border rounded-xl px-4 py-3" placeholder="이름" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <input className="border rounded-xl px-4 py-3" placeholder="인스타그램 아이디 (@제외)" value={form.insta_id} onChange={e => setForm({...form, insta_id: e.target.value})} required />
          <input className="border rounded-xl px-4 py-3" placeholder="이메일" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="border rounded-xl px-4 py-3" placeholder="비밀번호" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" disabled={loading} className="bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">이미 계정이 있으신가요? <a href="/influencer/login" className="text-purple-600 font-semibold">로그인</a></p>
      </div>
    </div>
  )
}
