import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="fixed top-4 left-4">
        <button onClick={() => router.push('/')} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
          🏠 053 Meta 홈
        </button>
      </div>
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-purple-700 mb-2">시딩 플랫폼</h1>
          <p className="text-gray-500 text-sm">로그인할 계정 유형을 선택해주세요</p>
        </div>

        {/* 로그인 선택 카드 */}
        <div className="flex flex-col gap-4">

          {/* 인플루언서 로그인 */}
          <button onClick={() => router.push('/influencer/login')}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 text-left border-2 border-transparent hover:border-purple-400 group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-purple-200 transition">
                📱
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">인플루언서 로그인</p>
                <p className="text-sm text-gray-400">캠페인 참여 및 콘텐츠 제출</p>
              </div>
              <span className="ml-auto text-gray-300 group-hover:text-purple-400 text-xl transition">→</span>
            </div>
          </button>

          {/* 인플루언서 회원가입 */}
          <button onClick={() => router.push('/influencer/register')}
            className="bg-purple-600 rounded-2xl shadow-md hover:shadow-xl hover:bg-purple-700 transition-all p-4 text-left group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-lg">
                ✏️
              </div>
              <p className="font-bold text-white text-sm">인플루언서 회원가입</p>
              <span className="ml-auto text-purple-300 group-hover:text-white text-lg transition">→</span>
            </div>
          </button>

          <div className="border-t border-gray-200 my-2" />

          {/* 고객사 로그인 */}
          <button onClick={() => router.push('/client/login')}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 text-left border-2 border-transparent hover:border-blue-400 group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-200 transition">
                🏢
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">고객사 로그인</p>
                <p className="text-sm text-gray-400">캠페인 요청 및 진행 현황 확인</p>
              </div>
              <span className="ml-auto text-gray-300 group-hover:text-blue-400 text-xl transition">→</span>
            </div>
          </button>

          {/* 고객사 회원가입 */}
          <button onClick={() => router.push('/client/register')}
            className="bg-blue-600 rounded-2xl shadow-md hover:shadow-xl hover:bg-blue-700 transition-all p-4 text-left group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-lg">
                ✏️
              </div>
              <p className="font-bold text-white text-sm">고객사 회원가입</p>
              <span className="ml-auto text-blue-300 group-hover:text-white text-lg transition">→</span>
            </div>
          </button>

          <div className="border-t border-gray-200 my-2" />

          {/* 관리자 로그인 */}
          <button onClick={() => router.push('/client/login')}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 text-left border-2 border-transparent hover:border-gray-400 group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-gray-200 transition">
                🛠
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">관리자 로그인</p>
                <p className="text-sm text-gray-400">시스템 관리 및 캠페인 운영</p>
              </div>
              <span className="ml-auto text-gray-300 group-hover:text-gray-500 text-xl transition">→</span>
            </div>
          </button>

        </div>

        {/* 푸터 */}
        <p className="text-center text-xs text-gray-400 mt-8">
          © 2025 공오삼. All rights reserved. |{' '}
          <a href="/privacy" className="hover:text-purple-600 underline">개인정보처리방침</a>
        </p>
      </div>
    </div>
  )
}
