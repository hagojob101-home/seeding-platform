import { useState } from 'react'
import { supabase } from '../lib/supabase'

// 인플루언서·광고주 공용: 가입 이메일로 비밀번호 재설정 링크 발송
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    // 가입 여부를 드러내지 않도록 결과와 무관하게 같은 안내 (요청 제한 등 오류만 따로 표시)
    setMessage(error?.status === 429 ? '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' : '가입된 이메일이라면 비밀번호 재설정 링크를 보냈습니다. 메일함(스팸함 포함)을 확인해주세요.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-highlight px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2 text-ink">비밀번호 찾기</h1>
        <p className="text-sm text-muted text-center mb-6">가입한 이메일로 재설정 링크를 보내드립니다.</p>
        <p role="status" className="text-ink text-sm mb-4 text-center">{message}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="email" className="sr-only">이메일</label>
          <input id="email" className="border rounded-xl px-4 py-3" placeholder="이메일" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <button type="submit" disabled={loading} className="bg-ink text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50">
            {loading ? '보내는 중...' : '재설정 링크 받기'}
          </button>
        </form>
        <p className="text-center text-sm text-muted mt-4"><a href="/login" className="text-ink font-semibold hover:underline">로그인으로 돌아가기</a></p>
      </div>
    </div>
  )
}
