import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🌱</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">시딩 플랫폼</h1>
          <p className="text-gray-500 text-sm">인플루언서 마케팅 관리 시스템</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/influencer/login')}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition"
          >
            인플루언서 로그인
          </button>

          <button
            onClick={() => router.push('/influencer/register')}
            className="w-full border-2 border-purple-600 text-purple-600 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 transition"
          >
            인플루언서 회원가입
          </button>

          <div className="border-t my-2" />

          <button
            onClick={() => router.push('/client/login')}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-700 transition"
          >
            고객사 / 관리자 로그인
          </button>

          <button
            onClick={() => router.push('/client/register')}
            className="w-full border-2 border-gray-700 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition"
          >
            고객사 회원가입
          </button>
        </div>
      </div>
    </div>
  )
}
