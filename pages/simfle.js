import Head from 'next/head'
import { useId, useState } from 'react'
import Footer from '../components/Footer'

// ───────── 3D 오브젝트 (SVG) ─────────
const COL = {
  blue: ['#9CC0FF', '#2F67E0', '#0A2470'],
  pink: ['#FFB3CF', '#D2457A', '#6E1238'],
  gold: ['#FFE7A3', '#F2B935', '#8A5A06'],
  white: ['#FFFFFF', '#DCE6F7', '#8EA4CF'],
}
const useSvgId = () => 'g' + useId().replace(/:/g, '')

function Shadow({ cx, cy, rx, ry, a = 0.28 }) {
  const id = useSvgId()
  return (
    <>
      <defs><radialGradient id={id}><stop offset="0" stopColor="#0E1F4D" stopOpacity={a} /><stop offset="1" stopColor="#0E1F4D" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} />
    </>
  )
}

function Sphere({ cx, cy, r, c, shadow = true }) {
  const id = useSvgId()
  const [l, b, d] = COL[c]
  return (
    <>
      <defs><radialGradient id={id} cx=".36" cy=".3" r=".78"><stop offset="0" stopColor={l} /><stop offset=".5" stopColor={b} /><stop offset="1" stopColor={d} /></radialGradient></defs>
      {shadow && <Shadow cx={cx} cy={cy + r * 1.08} rx={r * 0.9} ry={r * 0.18} />}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
      <ellipse cx={cx - r * 0.32} cy={cy - r * 0.42} rx={r * 0.3} ry={r * 0.16} fill="#fff" opacity=".55" transform={`rotate(-28 ${cx - r * 0.32} ${cy - r * 0.42})`} />
    </>
  )
}

function Cube({ x, y, a, c, shadow = true }) {
  const id = useSvgId()
  const [l, b, d] = COL[c]
  const k = a * 0.866
  const P = pts => pts.map(p => p.join(',')).join(' ')
  return (
    <>
      <defs>
        <linearGradient id={id + 't'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor={l} /></linearGradient>
        <linearGradient id={id + 'l'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={b} /><stop offset="1" stopColor={d} /></linearGradient>
        <linearGradient id={id + 'r'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={l} /><stop offset="1" stopColor={b} /></linearGradient>
      </defs>
      {shadow && <Shadow cx={x} cy={y + 2.05 * a} rx={k * 1.25} ry={a * 0.28} />}
      <polygon points={P([[x - k, y + a / 2], [x, y + a], [x, y + 2 * a], [x - k, y + 1.5 * a]])} fill={`url(#${id}l)`} />
      <polygon points={P([[x, y + a], [x + k, y + a / 2], [x + k, y + 1.5 * a], [x, y + 2 * a]])} fill={`url(#${id}r)`} />
      <polygon points={P([[x, y], [x + k, y + a / 2], [x, y + a], [x - k, y + a / 2]])} fill={`url(#${id}t)`} />
    </>
  )
}

function Cylinder({ cx, cy, rx, ry, t, c, ring }) {
  const id = useSvgId()
  const [l, b, d] = COL[c]
  return (
    <>
      <defs>
        <linearGradient id={id + 's'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={d} /><stop offset=".35" stopColor={b} /><stop offset=".6" stopColor={l} /><stop offset="1" stopColor={d} /></linearGradient>
        <radialGradient id={id + 'f'} cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#fff" /><stop offset=".35" stopColor={l} /><stop offset="1" stopColor={b} /></radialGradient>
      </defs>
      <path d={`M${cx - rx},${cy} L${cx - rx},${cy + t} A${rx},${ry} 0 0 0 ${cx + rx},${cy + t} L${cx + rx},${cy} Z`} fill={`url(#${id}s)`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}f)`} />
      {ring && <ellipse cx={cx} cy={cy} rx={rx * 0.7} ry={ry * 0.7} fill="none" stroke={d} strokeOpacity=".35" strokeWidth="3" />}
    </>
  )
}

function Coins({ cx, base, n, rx = 70, ry = 24, t = 22 }) {
  return (
    <>
      <Shadow cx={cx} cy={base + t + ry * 0.6} rx={rx * 1.3} ry={ry * 0.9} />
      {Array.from({ length: n }, (_, i) => <Cylinder key={i} cx={cx + (i % 2 ? 4 : -2)} cy={base - i * t} rx={rx} ry={ry} t={t} c="gold" ring />)}
    </>
  )
}

function Capsule({ x, y, w, h, rot, c }) {
  const id = useSvgId()
  const [l, b, d] = COL[c]
  return (
    <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={l} /><stop offset=".45" stopColor={b} /><stop offset="1" stopColor={d} /></linearGradient></defs>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={`url(#${id})`} />
      <rect x={x + h * 0.4} y={y + h * 0.14} width={w - h * 0.8} height={h * 0.18} rx={h * 0.09} fill="#fff" opacity=".45" />
    </g>
  )
}

const Art = ({ w, h, label, className = '', children }) => (
  <svg viewBox={`0 0 ${w} ${h}`} className={`max-w-full h-auto ${className}`} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>{children}</svg>
)

// 3,000명 무리: 시드 고정 난수라 서버·클라이언트 렌더 결과가 같음
const CROWD = (() => {
  let s = 11
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const hl = [[250, 420], [430, 330], [330, 530]]
  const far = (x, y, pts, d) => pts.every(([u, v]) => (x - u) ** 2 + (y - v) ** 2 > d * d)
  const pts = []
  for (let i = 0; i < 2000; i++) {
    const a = rnd() * 2 * Math.PI, r = 300 * Math.sqrt(rnd())
    const x = 340 + r * Math.cos(a), y = 360 + r * Math.sin(a) * 0.8
    if (far(x, y, pts, 31) && far(x, y, hl, 78)) pts.push([x, y, rnd() < 0.3 ? 'b' : 'w'])
  }
  return { pts: pts.sort((p, q) => p[1] - q[1]), hl }
})()

function Crowd() {
  const id = useSvgId()
  const grad = (k, [l, b, d]) => <radialGradient id={id + k} cx=".36" cy=".3" r=".78"><stop offset="0" stopColor={l} /><stop offset=".5" stopColor={b} /><stop offset="1" stopColor={d} /></radialGradient>
  return (
    <Art w={680} h={720} label="수많은 작은 구체 사이에서 분홍 구체 3개가 강조된 그림: 3,000명 중 내 브랜드에 맞는 인플루언서 매칭">
      <defs>{grad('w', COL.white)}{grad('b', COL.blue)}{grad('p', COL.pink)}</defs>
      <Shadow cx={340} cy={690} rx={320} ry={40} a={0.2} />
      {CROWD.pts.map(([x, y, k], i) => <circle key={i} cx={x} cy={y} r={10 + ((y - 60) / 600) * 8} fill={`url(#${id + k})`} opacity={0.5 + (y / 700) * 0.5} />)}
      {CROWD.hl.map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="58" fill="none" stroke="#1F4FB8" strokeWidth="3" strokeDasharray="6 8" />
          <circle cx={x} cy={y} r="44" fill={`url(#${id}p)`} />
          <ellipse cx={x - 14} cy={y - 18} rx="13" ry="7" fill="#fff" opacity=".55" transform={`rotate(-28 ${x - 14} ${y - 18})`} />
        </g>
      ))}
    </Art>
  )
}

// ───────── 콘텐츠 ─────────
const RELIEF = [
  { t: '일정 조율', d: '인플루언서 컨택부터 촬영·업로드 일정, 계약서까지 simfle이 조율합니다.', art: <><Cube x={80} y={8} a={64} c="blue" /><Cube x={160} y={70} a={32} c="white" /></> },
  { t: '원고료 책정', d: '팔로워 수 기준으로 원고료가 정해져 있어, 인플루언서마다 협상할 필요가 없습니다.', art: <Coins cx={100} base={90} n={3} rx={64} ry={22} t={20} /> },
  { t: '정산 업무', d: '버짓을 한 번 입금하면 인플루언서별 송금과 서류 확인은 simfle이 합니다.', art: <><Sphere cx={80} cy={70} r={54} c="pink" /><Coins cx={162} base={96} n={2} rx={34} ry={12} t={12} /></> },
]

const STEPS = [
  ['brand', '컨설팅 신청', '아래 문의 폼에 연락처와 문의 내용을 남깁니다.'],
  ['simfle', '광고주 초대', '상담 후 초대 메일을 보내면 광고주 계정이 생깁니다.'],
  ['brand', '캠페인 요청', '제품명·URL·가격, 1개월 버짓, 최소 인플루언서 수를 입력합니다.'],
  ['simfle', '검토·승인', '요청을 승인하거나, 사유를 남기고 거절합니다.'],
  ['brand', '버짓 입금', '설정한 1개월 버짓을 simfle에 송금합니다.'],
  ['simfle', '인플루언서 컨택', '인플루언서에게 연락해 일정, 계약서, 버짓을 조율합니다.'],
]

const FEES = [['1만 미만', '5만원', 1], ['1만 ~ 3만', '15만원', 3], ['3만 이상', '30만원', 6]]

const FIELDS = [
  { name: 'manager_name', label: '담당자 이름', required: true, maxLength: 50, autoComplete: 'name' },
  { name: 'job_title', label: '직함', required: true, maxLength: 50, placeholder: '예: 마케팅 팀장', autoComplete: 'organization-title' },
  { name: 'phone_number', label: '전화번호', type: 'tel', required: true, maxLength: 20, placeholder: '010-1234-5678', autoComplete: 'tel', pattern: '[0-9+\\-\\s()]{8,20}' },
  { name: 'sns_url', label: '브랜드 SNS', type: 'url', maxLength: 300, placeholder: 'https://instagram.com/...' },
  { name: 'website_url', label: '홈페이지', type: 'url', maxLength: 300, placeholder: 'https://...', autoComplete: 'url', wide: true },
]

const eyebrow = 'font-display text-sm font-semibold tracking-[0.25em] uppercase text-brand'
const h2 = 'font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight text-balance'
const card = 'bg-white rounded-[28px] shadow-[0_1px_2px_rgba(14,31,77,.06),0_18px_40px_rgba(14,31,77,.10)]'
const cta = 'inline-flex items-center justify-center rounded-full font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

function ContactForm() {
  const [status, setStatus] = useState({ state: 'idle', msg: '' })

  async function onSubmit(e) {
    e.preventDefault()
    setStatus({ state: 'sending', msg: '' })
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '접수 중 오류가 발생했습니다.')
      setStatus({ state: 'done', msg: '' })
    } catch (err) {
      setStatus({ state: 'error', msg: `${err.message} 잠시 후 다시 시도해주세요.` })
    }
  }

  if (status.state === 'done') return (
    <div role="status" className={`${card} p-10 md:p-14 text-center`}>
      <p className="font-display text-3xl font-bold text-brand">문의가 접수됐습니다</p>
      <p className="mt-3 text-sub">3시간 이내로 연락드립니다.</p>
    </div>
  )

  const input = 'mt-2 w-full rounded-2xl border border-[#D5DDEC] bg-[#F6F8FC] px-4 py-3.5 text-ink placeholder:text-[#8A93A8] focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/30'
  return (
    <form onSubmit={onSubmit} className={`${card} p-6 md:p-12 grid gap-5 md:grid-cols-2`}>
      {FIELDS.map(({ name, label, wide, ...rest }) => (
        <label key={name} htmlFor={name} className={`block text-sm font-bold text-ink ${wide ? 'md:col-span-2' : ''}`}>
          {label}{rest.required ? <span className="text-brand" aria-hidden="true"> *</span> : <span className="font-normal text-sub"> (선택)</span>}
          <input id={name} name={name} type={rest.type || 'text'} className={input} {...rest} />
        </label>
      ))}
      <label htmlFor="inquiry_message" className="block text-sm font-bold text-ink md:col-span-2">
        문의 내용<span className="text-brand" aria-hidden="true"> *</span>
        <textarea id="inquiry_message" name="inquiry_message" required maxLength={2000} rows={5}
          placeholder="제품, 예상 버짓, 원하는 시작 시기 등을 자유롭게 적어주세요." className={`${input} resize-none`} />
      </label>
      {/* 허니팟: 사람에게 안 보이는 필드 */}
      <input type="text" name="company_fax" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="md:col-span-2 flex flex-col gap-3">
        <button type="submit" disabled={status.state === 'sending'}
          className={`${cta} w-full bg-brand text-white py-5 text-lg hover:bg-[#1A43A0] focus-visible:outline-brand disabled:opacity-60`}>
          {status.state === 'sending' ? '보내는 중...' : '문의하기'}
        </button>
        <p role="alert" aria-live="assertive" className="text-sm text-[#B42318] min-h-[1.25rem]">{status.state === 'error' && status.msg}</p>
        <p className="text-xs text-sub">보내주신 정보는 상담 연락에만 사용합니다. <a href="/privacy" className="underline">개인정보처리방침</a></p>
      </div>
    </form>
  )
}

export default function Simfle() {
  return (
    <>
      <Head>
        <title>simfle — 인플루언서 시딩 플랫폼</title>
        <meta name="description" content="배송만 하세요. 나노·마이크로 인플루언서 매칭부터 일정 조율, 원고료 송금까지 simfle이 합니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&family=Sora:wght@500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          html{scroll-behavior:smooth} @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
          .simfle{font-family:'Noto Sans KR',-apple-system,sans-serif;color:#121A33;background:#F6F8FC;word-break:keep-all}
          .simfle .font-display{font-family:'Sora','Noto Sans KR',sans-serif}
          .simfle .text-ink{color:#121A33} .simfle .text-sub{color:#4E5873}
          .simfle .grad-text{background:linear-gradient(135deg,#4F8BFF,#1F4FB8);-webkit-background-clip:text;background-clip:text;color:transparent}
          .simfle .text-balance{text-wrap:balance}
        `}</style>
      </Head>

      <div className="simfle min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-white px-4 py-2 rounded-lg">본문 바로가기</a>

        <header className="sticky top-0 z-40 bg-[#0E1F4D]/85 backdrop-blur text-white">
          <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4" aria-label="주요 메뉴">
            <a href="#top" className="font-display text-2xl font-bold tracking-tight">simfle</a>
            <div className="flex items-center gap-1 md:gap-6 text-sm">
              <a href="#matching" className="hidden md:inline text-[#C9D7FF] hover:text-white">매칭</a>
              <a href="#process" className="hidden md:inline text-[#C9D7FF] hover:text-white">진행 방식</a>
              <a href="#fee" className="hidden md:inline text-[#C9D7FF] hover:text-white">원고료</a>
              <a href="/login" className="px-3 py-2 text-[#C9D7FF] hover:text-white">로그인</a>
              <a href="#contact" className={`${cta} bg-white text-[#1F4FB8] px-5 py-2.5 hover:bg-[#E3EBFB] focus-visible:outline-white`}>문의하기</a>
            </div>
          </nav>
        </header>

        <main id="main">
          {/* 히어로 */}
          <section id="top" className="-mt-16 pt-16 text-white bg-[radial-gradient(circle_at_75%_40%,#3A74EA_0%,#1F4FB8_40%,#0E1F4D_100%)]">
            <div className="max-w-6xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
              <div className="flex flex-col gap-6">
                <p className="font-display text-xs md:text-sm font-semibold tracking-[0.3em] text-[#B9CEFF]">INFLUENCER SEEDING PLATFORM</p>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.2] tracking-tight text-balance">배송만 하세요.<br />나머지는 simfle이 할게요.</h1>
                <p className="text-lg md:text-xl leading-relaxed text-[#D6E2FF]">광고주는 버짓만 정하세요.<br />섭외부터 원고료 송금까지 simfle이 합니다.</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a href="#contact" className={`${cta} bg-white text-[#1F4FB8] px-8 py-4 text-lg hover:bg-[#E3EBFB] focus-visible:outline-white`}>문의하기</a>
                  <a href="#process" className={`${cta} border border-white/40 px-8 py-4 text-lg hover:bg-white/10 focus-visible:outline-white`}>진행 방식 보기</a>
                </div>
              </div>
              <Art w={860} h={760} label="파란 광택 구체, 흰 큐브, 분홍 캡슐, 금색 구체로 이루어진 3D 구성">
                <Cube x={250} y={380} a={120} c="white" />
                <Sphere cx={540} cy={360} r={230} c="blue" />
                <Capsule x={470} y={600} w={300} h={96} rot={-24} c="pink" />
                <Sphere cx={760} cy={150} r={58} c="gold" shadow={false} />
                <Sphere cx={230} cy={190} r={40} c="white" shadow={false} />
                <Sphere cx={130} cy={640} r={26} c="blue" shadow={false} />
              </Art>
            </div>
          </section>

          {/* 매칭 */}
          <section id="matching" className="scroll-mt-16 max-w-6xl mx-auto px-5 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col gap-5">
              <p className={eyebrow}>Matching</p>
              <p className="text-2xl md:text-3xl font-extrabold">나노·마이크로 인플루언서</p>
              <p className="font-display grad-text text-6xl sm:text-7xl lg:text-8xl font-bold whitespace-nowrap tracking-tighter leading-none">3,000명</p>
              <p className="text-lg leading-relaxed text-sub">카테고리별로 협찬·무가·유가 광고를 이미 진행해 본 인플루언서만 모았습니다. 그중 <b className="text-ink">내 브랜드 카테고리를 경험한 인플루언서</b>를 매칭합니다.</p>
              <ul className="flex flex-wrap gap-2" aria-label="광고 진행 경험">
                {['협찬', '무가 광고', '유가 광고'].map(t => <li key={t} className="rounded-full bg-[#E3EBFB] text-brand font-bold px-4 py-1.5">{t}</li>)}
              </ul>
            </div>
            <Crowd />
          </section>

          {/* 광고주 혜택 */}
          <section className="bg-[#E9EEF8]">
            <div className="max-w-6xl mx-auto px-5 py-20 md:py-28 flex flex-col gap-10">
              <div className="flex flex-col gap-3">
                <p className={eyebrow}>For brands</p>
                <h2 className={h2}>광고주는 일정 조율, 원고료 책정,<br className="hidden md:block" /> 정산 업무에서 해방됩니다</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {RELIEF.map(({ t, d, art }) => (
                  <article key={t} className={`${card} p-8 flex flex-col gap-4`}>
                    <div className="flex items-start justify-between">
                      <Art w={200} h={150} label="" className="w-32">{art}</Art>
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-brand text-white text-sm font-bold px-3 py-1">simfle이 대신</span>
                    </div>
                    <h3 className="text-2xl font-extrabold">{t}</h3>
                    <p className="text-sub leading-relaxed">{d}</p>
                  </article>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-extrabold mr-2">광고주가 할 일</p>
                {['캠페인 요청', '버짓 입금', '제품 발송'].map(t => <span key={t} className="rounded-full bg-white text-brand font-bold px-4 py-1.5">{t}</span>)}
              </div>
            </div>
          </section>

          {/* 진행 방식 */}
          <section id="process" className="scroll-mt-16 max-w-6xl mx-auto px-5 py-20 md:py-28 flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <p className={eyebrow}>Process</p>
              <h2 className={h2}>캠페인이 열리기까지</h2>
            </div>
            <ol className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {STEPS.map(([who, t, d], i) => (
                <li key={t} className={`${card} p-7 flex flex-col gap-3`}>
                  <div className="flex items-center justify-between">
                    <span className="font-display grad-text text-4xl font-bold">0{i + 1}</span>
                    <span className={`rounded-full text-sm font-bold px-3 py-1 ${who === 'brand' ? 'bg-[#E3EBFB] text-brand' : 'bg-[#DDE3EF] text-[#0E1F4D]'}`}>{who === 'brand' ? '광고주' : 'simfle'}</span>
                  </div>
                  <h3 className="text-xl font-extrabold">{t}</h3>
                  <p className="text-sub leading-relaxed">{d}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* 돈의 흐름 */}
          <section className="bg-white">
            <div className="max-w-6xl mx-auto px-5 py-20 md:py-28 flex flex-col gap-10">
              <div className="flex flex-col gap-3">
                <p className={eyebrow}>Money flow</p>
                <h2 className={h2}>원고료는 simfle을 거쳐 지급됩니다</h2>
              </div>
              <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-4 text-center">
                {[
                  ['광고주', '1개월 버짓 설정', 'text-brand', <Cube key="c" x={180} y={46} a={88} c="blue" shadow={false} />],
                  ['초기 버짓 송금', '캠페인 승인 후'],
                  ['simfle', '버짓 보관·정산', 'text-[#0E1F4D]', <Coins key="c" cx={180} base={196} n={5} rx={74} ry={25} t={24} />],
                  ['원고료 송금', '업로드 확인 후 차주 목요일'],
                  ['인플루언서', '팔로워 기준 원고료', 'text-[#B8326A]', <Sphere key="c" cx={180} cy={140} r={90} c="pink" shadow={false} />],
                ].map(([t, d, color, obj]) => obj ? (
                  <div key={t} className="flex flex-col items-center gap-1">
                    <Art w={360} h={336} label={`${t}: ${d}`} className="w-56">
                      <Shadow cx={180} cy={297} rx={161} ry={38} a={0.22} />
                      <Cylinder cx={180} cy={236} rx={140} ry={42} t={40} c="white" />
                      {obj}
                    </Art>
                    <h3 className={`text-2xl font-extrabold ${color}`}>{t}</h3>
                    <p className="text-sub">{d}</p>
                  </div>
                ) : (
                  <div key={t} className="flex flex-col items-center gap-2 py-2">
                    <p className="font-extrabold">{t}</p>
                    <span aria-hidden="true" className="text-4xl text-brand md:rotate-0 rotate-90">→</span>
                    <p className="text-sm text-sub">{d}</p>
                  </div>
                ))}
              </div>
              <p className="text-sub">광고주와 인플루언서는 돈을 직접 주고받지 않습니다. 인플루언서의 계좌·주민번호는 simfle만 봅니다.</p>
            </div>
          </section>

          {/* 원고료 */}
          <section id="fee" className="scroll-mt-16 max-w-6xl mx-auto px-5 py-20 md:py-28 flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <p className={eyebrow}>Fee</p>
              <h2 className={h2}>원고료는 팔로워 수로 정해집니다</h2>
            </div>
            <ul className="grid md:grid-cols-3 gap-6 items-end">
              {FEES.map(([k, v, n]) => (
                <li key={k} className={`${card} p-8 flex flex-col items-center gap-2`}>
                  <Art w={320} h={270} label={`코인 ${n}개 높이: ${v}`} className="w-48"><Coins cx={160} base={220} n={n} rx={84} ry={28} t={30} /></Art>
                  <p className="text-sub">팔로워 {k}</p>
                  <p className="font-display grad-text text-5xl font-bold tracking-tight">{v}</p>
                </li>
              ))}
            </ul>
            <p className="text-lg">업로드 확인 → 인플루언서 정산 신청 → <b>차주 목요일 simfle이 송금</b> <span className="text-sub">· 코인 1개 = 5만원</span></p>
          </section>

          {/* 문의 */}
          <section id="contact" className="scroll-mt-16 bg-[radial-gradient(circle_at_80%_20%,#2C61D4_0%,#1F4FB8_55%)]">
            <div className="max-w-3xl mx-auto px-5 py-20 md:py-28 flex flex-col gap-8">
              <div className="text-white flex flex-col gap-3 text-center">
                <h2 className={`${h2} text-white`}>배송만 하세요.<br />나머지는 simfle이 할게요.</h2>
                <p className="text-[#DCE5FA] text-lg">문의를 남겨주시면 3시간 이내로 연락드립니다.</p>
              </div>
              <ContactForm />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
