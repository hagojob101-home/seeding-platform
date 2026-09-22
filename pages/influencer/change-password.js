import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ChangePassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/influencer/login'); return }
      setChecking(false)
    }
    init()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.'); return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.'); return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    })
    if (updateError) { setError(updateError.message); setLoading(false); return }

    setLoading(false)
    alert('비밀번호가 변경되었습니다.')
    router.push('/influencer/dashboard')
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">확인 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-700">비밀번호 변경</h2>
          <p className="text-sm text-gray-400 mt-1">
            안전한 계정 이용을 위해 처음 로그인 시 비밀번호를 변경해주세요.
          </p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 py-2 rounded-xl">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">새 비밀번호 * (6자 이상)</label>
            <input className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:border-purple-400"
              placeholder="새 비밀번호 입력" type="password"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">새 비밀번호 확인 *</label>
            <input className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:border-purple-400"
              placeholder="새 비밀번호 재입력" type="password"
              value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required />
            {passwordConfirm && password !== passwordConfirm && (
              <p className="text-red-400 text-xs mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
            {passwordConfirm && password === passwordConfirm && password.length >= 6 && (
              <p className="text-green-500 text-xs mt-1">✓ 비밀번호가 일치합니다.</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition">
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  )
}
