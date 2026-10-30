import { NextResponse } from 'next/server'

// simfle은 053ad.kr과 분리: 053ad.kr/simfle로 들어오면 Vercel 주소로 보냄 (전용 도메인 정해지면 바꿀 수 있게 임시 이동)
const SIMFLE_ORIGIN = 'https://seeding-platform.vercel.app'
export const config = { matcher: ['/simfle', '/simfle/:path*'] }

export function middleware(req) {
  if (!req.headers.get('host')?.endsWith('053ad.kr')) return NextResponse.next()
  return NextResponse.redirect(SIMFLE_ORIGIN + req.nextUrl.pathname + req.nextUrl.search, 307)
}
