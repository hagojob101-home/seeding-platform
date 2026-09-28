import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// 재설정 메일 링크 도착 화면: 링크의 토큰으로 로그인된 상태에서 새 비밀번호 저장
export default function ResetPassword() {
  const [status, setStatus] = useState('checking') // checking | ready | invalid | done
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setStatus(session ? 'ready' : 'invalid'))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.')
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.')
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password, data: { must_change_password: false } })
    setLoading(false)
    if (updateError) return setError(updateError.message)
    await supabase.auth.signOut()
    setStatus('done')
  }

  const Card = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center bg-highlight px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md text-center">{children}</div>
    </div>
  )

  if (status === 'checking') return <Card><p className="text-muted">확인 중...</p></Card>
  if (status === 'invalid') return (
    <Card>
      <h1 className="text-xl font-bold text-ink mb-2">링크가 만료되었거나 올바르지 않습니다</h1>
      <a href="/forgot-password" className="text-ink font-semibold hover:underline">재설정 링크 다시 받기</a>
    </Card>
  )
  if (status === 'done') return (
    <Card>
      <h1 className="text-xl font-bold text-ink mb-2" role="status">비밀번호가 변경되었습니다</h1>
      <a href="/login" className="text-ink font-semibold hover:underline">새 비밀번호로 로그인하기</a>
    </Card>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-highlight px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-ink">새 비밀번호 설정</h1>
        <p role="alert" className="text-ink text-sm mb-4 text-center">{error}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="password" className="text-sm font-semibold text-muted">새 비밀번호 (6자 이상)</label>
          <input id="password" className="border rounded-xl px-4 py-3" type="password" autoComplete="new-password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
          <label htmlFor="confirm" className="text-sm font-semibold text-muted">새 비밀번호 확인</label>
          <input id="confirm" className="border rounded-xl px-4 py-3" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          <button type="submit" disabled={loading} className="bg-ink text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50">
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  )
}
