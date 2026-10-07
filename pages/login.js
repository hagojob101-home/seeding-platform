import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import RibbonGlow from '../components/originkit/ui/ribbon-glow'
import { useHome } from '../lib/home'

export default function Login() {
  const router = useRouter()
  const home = useHome()
  // '동작 줄이기' 설정 사용자에게는 멈춘 배경
  const [still, setStill] = useState(false)
  useEffect(() => setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches), [])

  return (
    <div className="relative min-h-screen bg-ink flex items-center justify-center px-4 py-20">
      <div aria-hidden="true" className="fixed inset-0">
        <RibbonGlow background="#191919" color1="#ffffff" color2="#8a8a8a" speed={still ? 0 : 50} style={{ minWidth: 0, minHeight: 0 }} />
      </div>
      <div className="fixed top-4 left-4 z-20">
        <button onClick={() => router.push(home.href)} className="bg-white border border-line text-ink px-4 py-2 rounded-xl text-sm font-semibold hover:bg-highlight transition">
          {home.label} 홈
        </button>
      </div>
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 sm:p-8">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-ink mb-2">시딩 플랫폼</h1>
          <p className="text-muted text-sm">로그인할 계정 유형을 선택해주세요</p>
        </div>

        {/* 로그인 선택 카드 */}
        <div className="flex flex-col gap-4">

          {/* 인플루언서 로그인 */}
          <button onClick={() => router.push('/influencer/login')}
            className="bg-white rounded-2xl transition-all p-6 text-left border-2 border-line hover:border-ink group">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-bold text-ink text-lg">인플루언서 로그인</p>
                <p className="text-sm text-muted">캠페인 참여 및 콘텐츠 제출</p>
              </div>
              <span className="ml-auto text-muted group-hover:text-ink text-xl transition">→</span>
            </div>
          </button>

          {/* 인플루언서 회원가입 */}
          <button onClick={() => router.push('/influencer/register')}
            className="bg-white rounded-2xl border border-line hover:bg-highlight transition-all p-4 text-left group">
            <div className="flex items-center gap-4">
              <p className="font-bold text-ink text-sm">인플루언서 회원가입</p>
              <span className="ml-auto text-muted group-hover:text-ink text-lg transition">→</span>
            </div>
          </button>

          <div className="border-t border-line my-2" />

          {/* 광고주 로그인 */}
          <button onClick={() => router.push('/client/login')}
            className="bg-white rounded-2xl transition-all p-6 text-left border-2 border-line hover:border-ink group">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-bold text-ink text-lg">광고주 로그인</p>
                <p className="text-sm text-muted">브랜드 · 캠페인 요청 및 진행 현황 확인</p>
              </div>
              <span className="ml-auto text-muted group-hover:text-ink text-xl transition">→</span>
            </div>
          </button>


          <div className="border-t border-line my-2" />

          {/* 관리자 로그인 */}
          <button onClick={() => router.push('/client/login?as=admin')}
            className="bg-white rounded-2xl transition-all p-6 text-left border-2 border-line hover:border-ink group">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-bold text-ink text-lg">관리자 로그인</p>
                <p className="text-sm text-muted">053 운영팀 · 전체 현황 관리</p>
              </div>
              <span className="ml-auto text-muted group-hover:text-ink text-xl transition">→</span>
            </div>
          </button>

        </div>

        {/* 푸터 */}
        <p className="text-center text-xs text-muted mt-8">
          © 2025 공오삼. All rights reserved. |{' '}
          <a href="/privacy" className="hover:text-ink underline">개인정보처리방침</a>
        </p>
      </div>
    </div>
  )
}
