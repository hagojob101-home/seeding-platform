import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🌱 시딩 플랫폼</h1>
        <p className="text-gray-500 mb-8">인플루언서 마케팅 관리 시스템</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push('/influencer/login')}
            className="bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
          >
            인플루언서 로그인
          </button>
          <button
            onClick={() => router.push('/influencer/register')}
            className="border-2 border-purple-600 text-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition"
          >
            인플루언서 회원가입
          </button>
          <hr className="my-2"/>
          <button
            onClick={() => router.push('/client/login')}
            className="bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition"
          >
            고객사 / 관리자 로그인
          </button>
        </div>
      </div>
    </div>
  )
}
