import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function ClientRegister() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    company_name: '',
    monthly_budget: '',
    product_url: '',
    product_name: '',
    product_price: '',
    min_influencers: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { role: 'client', company_name: form.company_name } }
      })
      if (signUpError) throw signUpError

      if (data.user) {
        const { error: insertError } = await supabase.from('clients').insert({
          user_id: data.user.id,
          email: form.email,
          company_name: form.company_name,
          monthly_budget: parseInt(form.monthly_budget.replace(/,/g, '')),
          product_url: form.product_url,
          product_name: form.product_name,
          product_price: parseInt(form.product_price.replace(/,/g, '')),
          min_influencers: parseInt(form.min_influencers),
        })
        if (insertError) throw insertError

        await supabase.from('users').insert({
          id: data.user.id,
          email: form.email,
          name: form.company_name,
          role: 'client',
        })
      }

      alert('회원가입이 완료되었습니다!')
      router.push('/client/login')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">고객사 회원가입</h1>
          <p className="text-gray-500 text-sm">시딩 플랫폼 파트너로 등록해주세요</p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-xl">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="border-b pb-4 mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">계정 정보</p>
            <div className="flex flex-col gap-3">
              <input
                className="border rounded-xl px-4 py-3"
                placeholder="이메일 *"
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required
              />
              <input
                className="border rounded-xl px-4 py-3"
                placeholder="비밀번호 * (6자리 이상)"
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">회사 & 제품 정보</p>
            <div className="flex flex-col gap-3">
              <input
                className="border rounded-xl px-4 py-3"
                placeholder="회사명 *"
                value={form.company_name}
                onChange={e => setForm({...form, company_name: e.target.value})}
                required
              />
              <input
                className="border rounded-xl px-4 py-3"
                placeholder="시딩할 제품명 *"
                value={form.product_name}
                onChange={e => setForm({...form, product_name: e.target.value})}
                required
              />
              <input
                className="border rounded-xl px-4 py-3"
                placeholder="제품 URL * (쇼핑몰 링크)"
                value={form.product_url}
                onChange={e => setForm({...form, product_url: e.target.value})}
                required
              />
              <input
                className="border rounded-xl px-4 py-3"
                placeholder="제품 가격 * (예: 50000)"
                type="number"
                value={form.product_price}
                onChange={e => setForm({...form, product_price: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">예산 정보</p>
            <div className="flex flex-col gap-3">
              <div>
                <input
                  className="border rounded-xl px-4 py-3 w-full"
                  placeholder="1개월 버짓 * (예: 1000000)"
                  type="number"
                  value={form.monthly_budget}
                  onChange={e => setForm({...form, monthly_budget: e.target.value})}
                  required
                />
                {form.monthly_budget && (
                  <p className="text-xs text-purple-600 mt-1 ml-1">
                    = {Number(form.monthly_budget).toLocaleString()}원
                  </p>
                )}
              </div>
              <div>
                <input
                  className="border rounded-xl px-4 py-3 w-full"
                  placeholder="최소 인플루언서 수 * (예: 10)"
                  type="number"
                  value={form.min_influencers}
                  onChange={e => setForm({...form, min_influencers: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-700 transition mt-2"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          이미 계정이 있으신가요?{' '}
          <a href="/client/login" className="text-gray-800 font-semibold hover:underline">로그인</a>
        </p>
      </div>
    </div>
  )
}
