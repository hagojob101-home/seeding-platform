import Head from 'next/head'

// 랜딩·블로그 공통 머리글·바닥글 (simfle)
// simfle 전용 도메인이 정해지기 전까지 053ad.kr/simfle 아래에 두고 검색 노출은 막는다 (053ad.kr은 053 사이트)
export const SF = '/simfle'
export const SITE_URL = 'https://www.053ad.kr/simfle'
export const sfWrap = 'max-w-[1120px] mx-auto px-6'

const navLink = 'inline-flex items-center min-h-[44px] px-3.5 text-[15px] no-underline text-sf-ink hover:text-[#444]'

export function SfHeader() {
  return (
    <header className="border-b border-sf-line">
      <Head><meta name="robots" content="noindex" /></Head>
      <div className={`${sfWrap} py-4 flex flex-wrap items-center justify-between gap-4`}>
        <a href={SF} className="font-plexmono text-2xl font-medium no-underline text-sf-ink tracking-[-0.02em]">simfle</a>
        <nav aria-label="주요 메뉴" className="flex flex-wrap items-center gap-1">
          <a href={`${SF}/blog`} className={navLink}>블로그</a>
          <a href={`${SF}#pricing`} className={navLink}>요금</a>
          <a href="/login" className={navLink}>로그인</a>
          <a href={`${SF}#contact`} className="inline-flex items-center min-h-[44px] px-[18px] text-[15px] font-medium no-underline text-white bg-sf-ink rounded-lg">상담 신청</a>
        </nav>
      </div>
    </header>
  )
}

export function SfFooter() {
  return (
    <footer className={`${sfWrap} py-8 flex flex-wrap justify-between gap-3 text-sm text-sf-sub`}>
      <address className="not-italic flex flex-col gap-1">
        <span>스튜디오1216 · 사업자등록번호 825-16-02903</span>
        <span>(04785) 서울특별시 성동구 뚝섬로13길 38 (성수동2가 271-1) KT&amp;G 상상플래닛</span>
        <span>(42956) 대구 달성군 화원읍 성천로 5 달성청년혁신센터</span>
        <span>© 2026 simfle</span>
      </address>
      <a href="/privacy" className="inline-flex items-center min-h-[44px] text-sf-sub">개인정보처리방침</a>
    </footer>
  )
}
