import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function InfluencerRegister() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password: '',
    password_confirm: '',
    phone: '',
    instagram: '',
    youtube: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.password_confirm) {
      setError('비밀번호가 일치하지 않습니다.'); return
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.'); return
    }
    if (!agreed) {
      setError('개인정보처리방침에 동의해주세요.'); return
    }
    if (!form.instagram && !form.youtube) {
      setError('SNS 주소를 1개 이상 입력해주세요.'); return
    }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    const { error: upsertError } = await supabase.from('users').upsert({
      id: data.user.id,
      email: form.email,
      name: form.email.split('@')[0],
      phone: form.phone,
      instagram: form.instagram,
      youtube: form.youtube,
      role: 'influencer',
    })
    if (upsertError) { setError('계정 생성 오류: ' + upsertError.message); setLoading(false); return }

    setLoading(false)
    alert('가입이 완료되었습니다! 마이페이지에서 세부 정보를 입력해주세요.')
    router.push('/influencer/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-700">인플루언서 회원가입</h2>
          <p className="text-sm text-gray-400 mt-1">기본 정보만 입력하고 시작하세요!</p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 py-2 rounded-xl">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">이메일 *</label>
            <input className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:border-purple-400"
              placeholder="example@email.com" type="email"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">비밀번호 * (6자 이상)</label>
            <input className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:border-purple-400"
              placeholder="비밀번호 입력" type="password"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">비밀번호 확인 *</label>
            <input className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:border-purple-400"
              placeholder="비밀번호 재입력" type="password"
              value={form.password_confirm} onChange={e => setForm({...form, password_confirm: e.target.value})} required />
            {form.password_confirm && form.password !== form.password_confirm && (
              <p className="text-red-400 text-xs mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
            {form.password_confirm && form.password === form.password_confirm && (
              <p className="text-green-500 text-xs mt-1">✓ 비밀번호가 일치합니다.</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">전화번호 *</label>
            <input className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:border-purple-400"
              placeholder="010-0000-0000" type="tel"
              value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">📱 SNS 주소 <span className="text-red-400 font-normal">(1개 이상 입력해주세요)</span></label>
            <input className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:border-purple-400 mb-2"
              placeholder="인스타그램 주소 (예: https://instagram.com/아이디)"
              value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} />
            <input className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:border-purple-400"
              placeholder="유튜브 주소 (예: https://youtube.com/채널)"
              value={form.youtube} onChange={e => setForm({...form, youtube: e.target.value})} />
            {!form.instagram && !form.youtube && (
              <p className="text-red-400 text-xs mt-1">SNS 주소를 1개 이상 입력해주세요.</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-3">
              💡 주민등록번호, 계좌번호, 신분증 등 정산에 필요한 정보는
              <span className="font-semibold text-purple-600"> 마이페이지</span>에서 입력할 수 있습니다.
            </p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-purple-600" />
              <span className="text-sm text-gray-600">
                <a href="/privacy" target="_blank" className="text-purple-600 font-semibold underline">개인정보처리방침</a>에 동의합니다. (필수)
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading || !agreed}
            className={`py-3 rounded-xl font-semibold transition text-white ${agreed ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 cursor-not-allowed'}`}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          이미 계정이 있으신가요?{' '}
          <a href="/influencer/login" className="text-purple-600 font-semibold">로그인</a>
        </p>
      </div>
    </div>
  )
}
