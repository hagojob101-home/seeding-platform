import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-highlight flex items-center justify-center px-4">
      <div className="fixed top-4 left-4">
        <button onClick={() => router.push('/')} className="bg-white border border-line text-ink px-4 py-2 rounded-xl text-sm font-semibold hover:bg-highlight transition">
          053 Meta 홈
        </button>
      </div>
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-ink mb-2">시딩 플랫폼</h1>
          <p className="text-muted text-sm">로그인할 계정 유형을 선택해주세요</p>
        </div>

        {/* 로그인 선택 카드 */}
        <div className="flex flex-col gap-4">

          {/* 인플루언서 로그인 */}
          <button onClick={() => router.push('/influencer/login')}
            className="bg-white rounded-2xl shadow-sm hover:shadow-sm transition-all p-6 text-left border-2 border-transparent hover:border-ink group">
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

          {/* 고객사 로그인 */}
          <button onClick={() => router.push('/client/login')}
            className="bg-white rounded-2xl shadow-sm hover:shadow-sm transition-all p-6 text-left border-2 border-transparent hover:border-ink group">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-bold text-ink text-lg">고객사 로그인</p>
                <p className="text-sm text-muted">캠페인 요청 및 진행 현황 확인</p>
              </div>
              <span className="ml-auto text-muted group-hover:text-ink text-xl transition">→</span>
            </div>
          </button>

          {/* 고객사 회원가입 */}
          <button onClick={() => router.push('/client/register')}
            className="bg-white rounded-2xl border border-line hover:bg-highlight transition-all p-4 text-left group">
            <div className="flex items-center gap-4">
              <p className="font-bold text-ink text-sm">고객사 회원가입</p>
              <span className="ml-auto text-muted group-hover:text-ink text-lg transition">→</span>
            </div>
          </button>

          <div className="border-t border-line my-2" />

          {/* 관리자 로그인 */}
          <button onClick={() => router.push('/client/login')}
            className="bg-white rounded-2xl shadow-sm hover:shadow-sm transition-all p-6 text-left border-2 border-transparent hover:border-ink group">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-bold text-ink text-lg">관리자 로그인</p>
                <p className="text-sm text-muted">시스템 관리 및 캠페인 운영</p>
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
