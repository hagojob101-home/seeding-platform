import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'

const COUNTRY_NAME = { KR: '한국', BR: '브라질' }

// 처음 화면의 예시 결과 (실제 분석 결과 아님)
const EXAMPLE = {
  example: true, keyword: '수분크림', category: '뷰티 › 스킨케어 › 수분크림',
  related: ['시카크림', '세럼', '앰플', '토너패드', '마스크팩'], collectedOn: '2026-10-05', country: 'KR',
  stats: { ads: 369, accounts: 171, collab: 72, brand: 84 },
  influencers: [{ handle: '@_xlluvia', brand: '메디큐브', followers: null }, { handle: '@uxzic_', brand: '메디큐브', followers: null }],
  lockedCount: 70,
}

// 대표 확인 전까지 비워 둠 → 비어 있으면 해당 영역을 숨긴다 (지어내지 않음)
const REVIEWS = [] // { quote, by }
const STATS = [] // { label, value: '1,200+' }
const CONTACT_DAYS = null // 영업일 기준 N일
const INDUSTRY_ANSWER = null // FAQ '어떤 업종이 가능한가요?'

const FAQ = [
  ['직접 운영해야 하나요?', '아니요. simfle이 대행 운영합니다. 브랜드는 요청하고, 진행 상황과 결과를 조회하고, 제품 발송만 체크하면 됩니다.'],
  ['인플루언서는 저희가 찾아야 하나요?', '아니요. 제품에 맞는 인플루언서는 simfle이 찾아 섭외합니다. 이미 함께하는 분이 있다면 같이 관리해 드립니다.'],
  ['정산은 언제 이루어지나요?', '업로드가 확인된 건만 정산합니다. 올라가지 않은 콘텐츠에 비용이 나가지 않습니다.'],
  ['어떤 업종이 가능한가요?', INDUSTRY_ANSWER],
  ['결제는 어떻게 하나요?', '결제는 계좌이체로 진행하며, 입금이 확인되면 세금계산서를 발행해 드립니다.'],
  ['어떻게 시작하나요?', '아래에서 상담을 신청하시면 담당자가 연락드립니다.'],
].filter(([, a]) => a)

const STEPS = [
  ['캠페인 요청', '제품과 목표만 알려주세요. 조건과 가이드는 simfle이 정리합니다.', null],
  ['섭외·선정', '제품에 맞는 인플루언서를 찾아 제안하고, 조건 협의까지 마칩니다.', 'simfle'],
  ['계약서 작성', '협의한 조건으로 계약서를 자동 생성해 인플루언서와 체결합니다.', 'simfle'],
  ['제품 발송', '모아 드린 배송 정보로 보내고, 발송 체크만 하면 됩니다.', 'brand'],
  ['콘텐츠·업로드 확인', '가이드대로 만들어졌는지, 실제로 올라갔는지 건별로 확인합니다.', 'simfle'],
  ['정산·결과', '업로드가 확인된 건만 정산합니다. 결과는 대시보드에 남습니다.', 'simfle'],
]

const PLANS = [
  { name: '7일 체험', price: '0원', unit: '/ 7일', desc: '전체 기능을 작은 규모로 먼저 써 보세요.', items: ['캠페인 1개', '인플루언서 10명까지', '진행·결과 대시보드'], cta: '체험 시작' },
  { name: '프로', badge: '가장 많이 선택', price: '69만원', unit: '/ 월', desc: '매달 캠페인 하나를 처음부터 끝까지.', items: ['월 1개 캠페인', '인플루언서 150명까지', '발굴부터 업로드 확인·정산', '성과 리포트'], cta: '프로 선택', primary: true },
  { name: '맥스', price: '270만원', unit: '/ 월', desc: '캠페인 3~4개를 동시에. 여러 브랜드, 상시 운영.', items: ['프로의 모든 기능', '브랜드·동시 캠페인 무제한', '전담 매니저'], cta: '맥스 선택' },
  { name: '엔터프라이즈', price: '별도 견적', desc: 'simfle 팀이 함께 운영합니다.', items: ['맥스의 모든 기능', '맞춤 물량·계약 조건', '보안 검토·세금계산서 발행'], cta: '도입 문의' },
]

// 잠긴 줄: 실제 데이터가 아닌 가짜 글자
const LOCKED_ROWS = [
  ['@influencer_id', '브랜드 이름', '검색어', '00.0K'], ['@beauty.account', '브랜드', '검색어', '000K'],
  ['@creator_name_', '브랜드 이름', '검색어', '0.0M'], ['@daily.skin', '브랜드', '검색어', '00.0K'], ['@account.id', '브랜드 이름', '검색어', '000K'],
]

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const fmt = n => (typeof n === 'number' ? n.toLocaleString('ko-KR') : n)
const wrap = 'max-w-[1120px] mx-auto px-6'
const h2 = 'm-0 text-[clamp(28px,3.8vw,44px)] leading-[1.25] tracking-[-0.03em] font-bold'
const Mark = ({ children }) => <span className="bg-sf-accent px-1.5">{children}</span>

const Check = ({ className = '' }) => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`flex-none mt-1 ${className}`}><path d="M5 12l5 5 9-10" /></svg>
)

// 굴러 올라가는 숫자: 화면용 숫자는 aria-hidden, 실제 값은 스크린리더용 텍스트로
function Roll({ value }) {
  const s = String(value)
  return (
    <>
      <span className="sr-only">{s}</span>
      <span aria-hidden="true" className="inline-flex">
        {[...s].map((ch, i) => {
          if (!/\d/.test(ch)) return <span key={i}>{ch}</span>
          const n = 10 + +ch
          return (
            <span key={i} className="inline-block h-[1.1em] overflow-hidden">
              <span className="sf-roll flex flex-col" style={{ transform: `translateY(-${(n * 1.1).toFixed(1)}em)`, animationDuration: `${(0.7 + i * 0.12).toFixed(2)}s` }}>
                {Array.from({ length: n + 1 }, (_, j) => <span key={j} className="h-[1.1em]">{j % 10}</span>)}
              </span>
            </span>
          )
        })}
      </span>
    </>
  )
}

const Words = ({ text }) => text.split(' ').map((w, i) => (
  <span key={i} className="sf-in inline-block whitespace-pre-wrap" style={{ animationDelay: `${150 + i * 60}ms` }}>{w + ' '}</span>
))

function chatLines(r, country) {
  const name = COUNTRY_NAME[country]
  const first = r.title ? `제품 페이지를 읽었습니다. 제품명은 ‘${r.title}’입니다.` : '제품 페이지를 읽었습니다.'
  if (!r.matched) return [first, `${name}에서 수집한 검색어 중 이 제품과 맞는 검색어를 찾지 못했습니다.`]
  return [
    first,
    r.matchedKeywords?.length ? `수집한 검색어 중 ‘${r.keyword}’ 외 ${r.matchedKeywords.length}개가 이 제품과 맞습니다.` : `수집한 검색어 중 ‘${r.keyword}’ 검색어가 가장 잘 맞습니다.`,
    r.stats.accounts != null ? `${name}에서 ‘${r.keyword}’ Meta 광고를 집행한 계정 ${fmt(r.stats.accounts)}개를 확인했습니다.` : `${name}에서 집행 중인 Meta 광고를 확인했습니다.`,
    '광고 협업 경험이 있는 인플루언서를 찾았습니다. 아래에서 결과를 확인하세요.',
  ]
}

function Result({ r }) {
  const name = COUNTRY_NAME[r.country]
  const stats = [['ads', '집행 중인 광고'], ['accounts', '광고 계정'], ['collab', '인플루언서 협업'], ['brand', '브랜드·쇼핑몰 직접 집행']].filter(([k]) => r.stats[k] != null)
  const total = r.influencers.length + r.lockedCount
  return (
    <section id="result" className="sf-in bg-sf-soft border-y border-sf-line" aria-labelledby="result-h">
      <div className={`${wrap} py-[72px] flex flex-col gap-8`}>
        <div className="flex flex-col gap-2" aria-live="polite">
          <div className="flex flex-wrap items-center gap-3">
            {r.example ? (
              <span className="px-3.5 py-1 font-plexmono text-[13px] font-medium tracking-[0.08em] border border-sf-ink rounded-full">예시</span>
            ) : (
              <span className="inline-flex items-center gap-2.5 pl-3 pr-3.5 py-1 font-plexmono text-[13px] font-medium tracking-[0.08em] text-white bg-sf-ink rounded-full">
                <span aria-hidden="true" className="relative w-2.5 h-2.5 text-sf-accent">
                  <span className="sf-live absolute -inset-[9px] rounded-full" style={{ background: 'radial-gradient(circle, currentColor 0%, transparent 70%)' }} />
                  <span className="absolute inset-0 rounded-full bg-current" />
                </span>LIVE
              </span>
            )}
            <p className="m-0 text-sm font-medium text-sf-sub">{r.example ? '분석 결과 예시 · ' : ''}{name}{r.collectedOn ? ` · ${r.collectedOn} 수집일 기준` : ''}</p>
          </div>
          <h2 id="result-h" className="m-0 text-[clamp(26px,3.2vw,36px)] leading-[1.3] tracking-[-0.02em] font-bold break-all">
            {r.example ? '예시 제품 분석 결과' : `${r.title || '제품'} 분석 결과`}
          </h2>
        </div>

        <div className="flex flex-wrap gap-4">
          {r.category && (
            <div className="flex-[1_1_280px] bg-white border border-sf-line rounded-[14px] p-6 flex flex-col gap-3">
              <h3 className="m-0 text-sm font-medium text-sf-sub">카테고리</h3>
              <p className="m-0 text-[22px] font-bold tracking-[-0.02em]">{r.category}</p>
            </div>
          )}
          <div className="flex-[2_1_420px] bg-white border border-sf-line rounded-[14px] p-6 flex flex-col gap-3">
            <h3 className="m-0 text-sm font-medium text-sf-sub">맞은 검색어</h3>
            <ul className="list-none m-0 p-0 flex flex-wrap gap-2">
              <li className="px-3.5 py-1.5 text-base font-bold bg-sf-accent rounded-full">{r.keyword}</li>
              {(r.matchedKeywords || []).map(k => <li key={k} className="px-3.5 py-1 text-base font-bold border-2 border-sf-ink rounded-full">{k}</li>)}
            </ul>
            {r.related.length > 0 && (
              <>
                <h3 className="m-0 mt-2 text-sm font-medium text-sf-sub">연관 검색어</h3>
                <ul className="list-none m-0 p-0 flex flex-wrap gap-2">
                  {r.related.map(k => <li key={k} className="px-3.5 py-1.5 text-base border border-sf-ink rounded-full">{k}</li>)}
                </ul>
              </>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="bg-white border border-sf-line rounded-[14px] p-6 flex flex-col gap-4">
            <h3 className="m-0 text-sm font-medium text-sf-sub">‘{r.keyword}’ Meta 광고 현황</h3>
            <dl className="sf-go m-0 flex flex-wrap gap-x-12 gap-y-6">
              {stats.map(([k, label]) => (
                <div key={k} className="flex flex-col-reverse gap-0.5">
                  <dt className="text-sm text-sf-sub">{label}</dt>
                  <dd className="m-0 font-plexmono text-[40px] font-medium leading-[1.1]">
                    <span className={k === 'collab' ? 'bg-sf-accent px-1.5' : ''}><Roll value={fmt(r.stats[k])} /></span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {total > 0 && (
          <div className="bg-white border border-sf-line rounded-[14px] overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="m-0 text-xl font-bold tracking-[-0.02em]">광고에 등장한 계정 {fmt(total)}개</h3>
              <p className="m-0 text-sm text-sf-sub">{r.influencers.length}개 공개{r.lockedCount ? ` · ${fmt(r.lockedCount)}개 잠김` : ''}</p>
            </div>
            {r.influencers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-base text-left">
                  <thead>
                    <tr className="border-y border-sf-line text-sm text-sf-sub">
                      {['인플루언서', '최근 협업 브랜드', '검색어', '팔로워'].map(h => <th key={h} scope="col" className="px-6 py-3 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {r.influencers.map(i => (
                      <tr key={i.handle} className="border-b border-sf-line">
                        <th scope="row" className="px-6 py-[18px] font-bold break-all">{i.handle}</th>
                        <td className="px-6 py-[18px]">{i.brand || '—'}</td>
                        <td className="px-6 py-[18px]">{i.keyword || r.keyword}</td>
                        <td className="px-6 py-[18px] text-sf-sub">{i.followers || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {r.lockedCount > 0 && (
              <div className="relative">
                <div aria-hidden="true" className="blur-[7px] select-none pointer-events-none text-base">
                  {LOCKED_ROWS.map((row, i) => (
                    <div key={i} className="flex gap-6 px-6 py-[18px] border-b border-sf-line last:border-b-0">
                      {row.map((c, j) => <span key={j} className={`flex-1 ${j ? '' : 'font-bold'}`}>{c}</span>)}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 bg-white/55 text-center">
                  <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  <p className="m-0 text-lg font-bold">나머지 {fmt(r.lockedCount)}개는 상담 신청 후 보내드립니다</p>
                  <a href="#contact" className="inline-flex items-center min-h-[52px] px-7 text-base font-bold no-underline text-sf-ink bg-sf-accent border-2 border-sf-ink rounded-[10px]">전체 리스트 받기</a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function StatsBand() {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window)) return setSeen(true)
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: '0px 0px -8% 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <section aria-label="실적" className="border-y border-sf-line">
      <div className={`${wrap} py-16`}>
        <dl ref={ref} className={`m-0 flex flex-wrap gap-x-6 gap-y-8 ${seen ? 'sf-go' : ''}`}>
          {STATS.map(s => (
            <div key={s.label} className="flex-[1_1_180px] flex flex-col-reverse gap-1">
              <dt className="text-[15px] text-sf-sub">{s.label}</dt>
              <dd className="m-0 font-plexmono text-[clamp(36px,4.4vw,52px)] font-medium leading-[1.1] tracking-[-0.03em]"><Roll value={s.value} /></dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Reviews() {
  const card = (r, i, hidden) => (
    <figure key={`${hidden ? 'c' : 'o'}${i}`} aria-hidden={hidden || undefined} className="flex-none w-[340px] m-0 p-6 flex flex-col justify-between gap-5 bg-white border border-sf-line rounded-[14px]">
      <blockquote className="m-0 pl-3.5 border-l-4 border-sf-accent text-[17px] leading-[1.55]">{r.quote}</blockquote>
      <figcaption className="text-sm text-sf-sub">{r.by}</figcaption>
    </figure>
  )
  return (
    <section id="reviews" aria-labelledby="reviews-h" className="pb-[88px] flex flex-col gap-7">
      <div className={`${wrap} w-full flex flex-col gap-3`}>
        <p className="m-0 text-[15px] font-medium text-sf-sub">고객 후기</p>
        <h2 id="reviews-h" className={h2}>먼저 써 본 브랜드들의 이야기</h2>
      </div>
      <div className="sf-mqw overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
        <div className="sf-mq flex gap-4 w-max">
          {REVIEWS.map((r, i) => card(r, i))}
          {REVIEWS.map((r, i) => card(r, i, true))}
        </div>
      </div>
    </section>
  )
}

function ContactForm({ product, setProduct, analysis }) {
  const [status, setStatus] = useState({ state: 'idle', msg: '' })

  async function onSubmit(e) {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget))
    const t = k => (f[k] || '').trim()
    const note = analysis && `[분석] ${COUNTRY_NAME[analysis.country]} · ${analysis.keyword ? `검색어 ‘${analysis.keyword}’` : '맞는 검색어 없음'} · ${analysis.url}`
    setStatus({ state: 'sending', msg: '보내는 중입니다.' })
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_name: t('name'),
          job_title: t('company'), // 기존 API 필수 항목 → 회사·브랜드명으로 채움
          phone_number: t('phone'),
          website_url: t('product'),
          inquiry_message: [`[회사·브랜드] ${t('company')}`, note, t('message') || '전체 리스트와 상담을 요청합니다.'].filter(Boolean).join('\n').slice(0, 2000),
          company_fax: f.company_fax || '',
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error)
      setStatus({ state: 'done', msg: '신청이 접수되었습니다. 담당자가 연락드리겠습니다.' })
    } catch (err) {
      setStatus({ state: 'error', msg: err.message || '접수하지 못했습니다. 잠시 후 다시 시도해 주세요.' })
    }
  }

  const input = 'w-full h-[52px] px-4 text-base text-sf-ink bg-white border-0 rounded-lg'
  const label = 'text-sm font-medium'
  const req = <span className="font-normal text-sf-dim">(필수)</span>

  if (status.state === 'done') return <p role="status" className="flex-[1_1_360px] m-0 text-lg font-bold">{status.msg}</p>
  return (
    <form onSubmit={onSubmit} className="flex-[1_1_360px] flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="company" className={label}>회사·브랜드명 {req}</label>
        <input id="company" name="company" type="text" autoComplete="organization" required maxLength={50} className={input} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={label}>담당자 이름 {req}</label>
        <input id="name" name="name" type="text" autoComplete="name" required maxLength={50} className={input} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className={label}>연락처 {req}</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="010-0000-0000" required pattern="[0-9+\-\s\(\)]{8,20}" title="숫자와 - 로 8~20자" maxLength={20} className={input} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="product" className={label}>제품 링크</label>
        <input id="product" name="product" type="url" placeholder="https://" maxLength={300} value={product} onChange={e => setProduct(e.target.value)} className={input} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className={label}>문의 내용</label>
        <textarea id="message" name="message" rows={4} maxLength={1500} className="w-full px-4 py-3 text-base text-sf-ink bg-white border-0 rounded-lg resize-y" />
      </div>
      <input type="text" name="company_fax" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2.5 min-h-[44px] text-sm text-sf-dim">
        <input name="agree" type="checkbox" required className="w-5 h-5 mt-0.5 flex-none" />
        <span><a href="/privacy" className="text-white">개인정보 수집·이용</a>에 동의합니다. (필수)</span>
      </label>
      <button type="submit" disabled={status.state === 'sending'} className="h-14 text-[17px] font-bold text-sf-ink bg-sf-accent border-0 rounded-[10px] cursor-pointer disabled:opacity-60">상담 신청하고 전체 리스트 받기</button>
      <p role="status" className="m-0 text-sm text-sf-dim min-h-[1.5em]">{status.state !== 'idle' ? status.msg : ''}</p>
    </form>
  )
}

export default function Home() {
  const [country, setCountry] = useState('KR')
  const [run, setRun] = useState(null) // { id, url, country }
  const [resp, setResp] = useState(null) // API 응답 또는 { error }
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(EXAMPLE)
  const [product, setProduct] = useState('')
  const runId = useRef(0)

  const lines = resp && !resp.error ? chatLines(resp, run.country) : []
  const done = lines.length > 0 && step >= lines.length
  const busy = run && !resp?.error && !done

  // 응답이 와야 문장을 채울 수 있음 → 응답 후 한 줄씩 (먼저 끝나도 연출은 끝까지)
  useEffect(() => {
    if (!lines.length || done) return
    if (reducedMotion()) return setStep(lines.length)
    const t = setTimeout(() => setStep(s => s + 1), step ? 1200 : 300)
    return () => clearTimeout(t)
  }, [resp, step]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!done) return
    setResult(resp.matched ? { ...resp, country: run.country, id: run.id } : null)
    if (resp.matched) setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' }), 0)
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  async function analyze(e) {
    e.preventDefault()
    const url = e.currentTarget.url.value.trim()
    const id = ++runId.current
    setRun({ id, url, country })
    setResp(null)
    setStep(0)
    setProduct(url)
    let data
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, country }) })
      const j = await res.json().catch(() => ({}))
      data = res.ok ? j : { error: j.error || '분석하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
    } catch {
      data = { error: '네트워크 연결을 확인하고 다시 시도해 주세요.' }
    }
    if (id === runId.current) setResp(data)
  }

  const bubble = 'm-0 self-start max-w-full px-[18px] py-3.5 text-base bg-white border border-sf-line rounded-[4px_16px_16px_16px]'
  const navLink = 'inline-flex items-center min-h-[44px] px-3.5 text-[15px] no-underline text-sf-ink hover:text-[#444]'

  return (
    <div className="sf font-plex text-sf-ink bg-white leading-[1.6] break-keep">
      <Head>
        <title>simfle — 제품 URL로 광고 중인 인플루언서 찾기</title>
        <meta name="description" content="제품 페이지 URL 하나로, 같은 카테고리에서 실제로 Meta 광고에 등장한 인플루언서를 보여드립니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="border-b border-sf-line">
        <div className={`${wrap} py-4 flex flex-wrap items-center justify-between gap-4`}>
          <a href="#top" className="font-plexmono text-2xl font-medium no-underline text-sf-ink tracking-[-0.02em]">simfle</a>
          <nav aria-label="주요 메뉴" className="flex flex-wrap items-center gap-1">
            <a href="#result" className={navLink}>분석 예시</a>
            <a href="#flow" className={navLink}>진행 방식</a>
            <a href="#pricing" className={navLink}>요금</a>
            <a href="#faq" className={navLink}>자주 묻는 질문</a>
            <a href="/login" className={navLink}>로그인</a>
            <a href="#contact" className="inline-flex items-center min-h-[44px] px-[18px] text-[15px] font-medium no-underline text-white bg-sf-ink rounded-lg">상담 신청</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className={`${wrap} pt-24 pb-20 flex flex-col gap-7`}>
          <p className="m-0 text-[15px] font-medium text-sf-sub">세상에서 제일 간단한 인플루언서 시딩 플랫폼</p>
          <h1 className="m-0 text-[clamp(34px,5.2vw,64px)] leading-[1.2] font-bold tracking-[-0.03em] max-w-[880px]">
            제품 URL 하나로,<br />지금 <span className="bg-sf-accent px-2">광고 중인 인플루언서</span>를 찾습니다
          </h1>
          <p className="m-0 text-[19px] text-sf-body max-w-[640px]">제품 페이지를 읽어 카테고리와 연관 검색어를 분석하고, 같은 카테고리에서 실제로 Meta 광고에 등장한 인플루언서를 보여드립니다.</p>

          <form onSubmit={analyze} className="flex flex-wrap items-end gap-3 max-w-[760px] mt-3">
            <div className="flex-[1_1_360px] flex flex-col gap-2">
              <label htmlFor="product-url" className="text-sm font-medium">제품 페이지 URL</label>
              <input id="product-url" name="url" type="url" required maxLength={2000} placeholder="https://" autoComplete="url" className="w-full h-[60px] px-[18px] text-[17px] text-sf-ink bg-white border-2 border-sf-ink rounded-[10px]" />
            </div>
            <div className="flex-[0_1_150px] flex flex-col gap-2">
              <label htmlFor="country" className="text-sm font-medium">국가</label>
              <select id="country" name="country" value={country} onChange={e => setCountry(e.target.value)} className="w-full h-[60px] px-3.5 text-[17px] text-sf-ink bg-white border-2 border-sf-ink rounded-[10px] cursor-pointer">
                <option value="KR">한국</option>
                <option value="BR">브라질</option>
              </select>
            </div>
            <button type="submit" disabled={busy} className="h-[60px] px-8 text-[17px] font-bold text-white bg-sf-ink border-0 rounded-[10px] cursor-pointer disabled:opacity-60">{busy ? '분석 중…' : '무료 분석'}</button>
          </form>
          <p className="m-0 text-sm text-sf-sub">제품 페이지의 공개 정보(제목·설명)만 읽습니다.</p>

          <div role="log" aria-live="polite" aria-label="simfle 분석 대화" className="max-w-[760px] min-h-[200px] mt-2 p-6 flex flex-col gap-3.5 bg-sf-soft border-2 border-sf-ink rounded-2xl">
            {run && (
              <p key={run.id} className="sf-in m-0 self-end max-w-[85%] px-4 py-3 text-base text-white bg-sf-ink rounded-[16px_16px_4px_16px] break-all">{run.url} · {COUNTRY_NAME[run.country]}</p>
            )}
            <p className="m-0 font-plexmono text-[13px] font-medium">simfle</p>
            {!run && <p className={bubble}>제품 페이지 URL을 넣고 무료 분석을 누르면, 여기에서 분석 과정을 보여드립니다.</p>}
            {step > 0 && (
              <div className={`${bubble} flex flex-col gap-2.5`}>
                {lines.slice(0, step).map(t => (
                  <p key={t} className="m-0 flex gap-2 text-base">
                    <span className="sf-in inline-flex"><Check /></span>
                    <span><Words text={t} /></span>
                  </p>
                ))}
              </div>
            )}
            {done && !resp.matched && (
              <div className={`${bubble} sf-in flex flex-col items-start gap-3`}>
                <p className="m-0">이 제품은 아직 수집 중입니다. 상담을 신청하시면 분석해 드립니다.</p>
                <a href="#contact" className="inline-flex items-center min-h-[44px] px-5 font-bold no-underline text-sf-ink bg-sf-accent border-2 border-sf-ink rounded-[10px]">상담 신청</a>
              </div>
            )}
            {resp?.error && <p className={`${bubble} sf-in`}>{resp.error}</p>}
            {busy && (
              <p className="m-0 flex items-center gap-2.5 text-[15px] text-sf-sub">
                <span aria-hidden="true" className="sf-pulse w-2.5 h-2.5 rounded-full bg-sf-ink" />분석 중
              </p>
            )}
          </div>
        </section>

        {result && <Result key={result.id ?? 0} r={result} />}

        <section id="why" className={`${wrap} pt-24 flex flex-wrap items-center gap-x-16 gap-y-10`}>
          <div className="flex-[1_1_280px] flex flex-col gap-2">
            <p className="m-0 text-[15px] font-medium text-sf-sub">피드 보고 무작위로 보낸 섭외 DM 응답률</p>
            <p className="m-0 font-plexmono text-[clamp(56px,8vw,96px)] font-medium leading-none tracking-[-0.04em]">5~15%</p>
            <p className="m-0 text-[17px] font-bold">열에 여덟아홉은 답이 없습니다.</p>
            <p className="m-0 text-[13px] text-sf-sub">인플루언서 콜드 아웃리치 업계 추정치</p>
          </div>
          <div className="flex-[2_1_420px] flex flex-col gap-4">
            <h2 className={h2}>그래서 simfle은 이미 광고 협업을 해본 <Mark>검증된 인플루언서</Mark>만 추천합니다</h2>
            <p className="m-0 text-lg text-sf-body">Meta 광고에 실제로 등장한 인플루언서만 골라냅니다. 브랜드 협업이 어떻게 진행되는지 이미 아는 사람들입니다.</p>
          </div>
        </section>

        <section id="flow" className={`${wrap} pt-24 flex flex-col gap-10`}>
          <div className="flex flex-col gap-3 max-w-[760px]">
            <p className="m-0 text-[15px] font-medium text-sf-sub">진행 방식</p>
            <h2 className={h2}>여섯 단계 중 브랜드가 할 일은 <Mark>발송</Mark>뿐</h2>
            <p className="m-0 text-lg text-sf-body">캠페인의 모든 단계가 한 화면에 기록됩니다. 엑셀도, 카톡방도 필요 없습니다.</p>
          </div>
          <ol className="list-none m-0 p-0 flex flex-wrap gap-x-4 gap-y-8">
            {STEPS.map(([title, desc, who], i) => (
              <li key={title} className="flex-[1_1_300px] border-t-[3px] border-sf-ink pt-5 flex flex-col gap-2">
                <span aria-hidden="true" className="font-plexmono text-sm text-sf-sub">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="m-0 text-xl font-bold">{title}</h3>
                <p className="m-0 text-[15px] text-sf-body">{desc}</p>
                {who === 'simfle' && <span className="self-start px-2.5 py-0.5 text-[13px] text-sf-body bg-sf-soft border border-sf-line rounded-full">simfle이 처리</span>}
                {who === 'brand' && <span className="self-start px-2.5 py-0.5 text-[13px] font-bold bg-sf-accent border border-sf-ink rounded-full">브랜드가 할 일</span>}
              </li>
            ))}
          </ol>
        </section>

        <section className={`${wrap} py-24 flex flex-wrap items-center gap-10`}>
          <div className="flex-[1_1_320px] flex flex-col gap-3">
            <h2 className="m-0 text-[clamp(24px,3vw,34px)] leading-[1.3] tracking-[-0.03em] font-bold">브랜드는 <Mark>실시간으로</Mark> 진행 상황을<br />모니터링하니 안심이죠</h2>
            <p className="m-0 text-lg text-sf-body">지금 어디까지 왔는지는 대시보드에서 확인해요.</p>
          </div>
          <figure className="flex-[2_1_480px] min-w-0 m-0 border-2 border-sf-ink rounded-2xl overflow-hidden">
            <figcaption className="flex justify-between gap-3 px-5 py-3 text-sm bg-sf-ink text-white"><span className="font-bold">브랜드 대시보드</span><span className="text-sf-dim">예시 화면</span></figcaption>
            <div className="p-5 flex flex-col gap-4 bg-white">
              <p className="m-0 text-lg font-bold">캠페인 이름</p>
              <ol className="list-none m-0 p-0 flex flex-wrap gap-1.5">
                {['신청', '승인', '계약', '제품발송', '콘텐츠확인', '업로드확인', '정산완료'].map(s => <li key={s} className="px-2.5 py-1 text-[13px] bg-white border border-sf-ink rounded-full">{s}</li>)}
              </ol>
              <div>
                {[['인플루언서 D', '계약서 서명 대기'], ['인플루언서 A', '제품 발송됨'], ['인플루언서 B', '콘텐츠 확인 중'], ['인플루언서 C', '업로드 확인 완료']].map(([n, s]) => (
                  <div key={n} className="flex flex-wrap items-center justify-between gap-2 py-3.5 border-t border-sf-line text-[15px]"><span className="font-bold">{n}</span><span className="px-2.5 py-0.5 text-[13px] bg-sf-soft rounded-md">{s}</span></div>
                ))}
              </div>
            </div>
          </figure>
        </section>

        {REVIEWS.length > 0 && <Reviews />}
        {STATS.length > 0 && <StatsBand />}

        <section className={`${wrap} py-24 flex flex-col gap-10`}>
          <h2 className={h2}>실무를 하는 팀을 위해 만들었습니다</h2>
          <div className="flex flex-wrap gap-4">
            {[
              ['D2C 브랜드', '인원을 늘리지 않고 제품 협찬·시딩·유료 협업을 운영하세요. 섭외와 후속 연락은 simfle이 맡고, 브랜드는 조건을 승인하고 올라온 게시물만 확인합니다.', ['제품에 맞는 인플루언서 발굴', '정해 둔 기준 안에서 제안·조건 협의·계약서 체결', '배송 추적부터 업로드 확인까지'], '시작하기', true],
              ['에이전시', '담당자 한 명이 더 많은 브랜드 캠페인을 운영합니다. 브랜드마다 별도 작업 공간, 같은 진행 체계, 확인이 끝난 리포트.', ['여러 브랜드 캠페인 동시 운영', '브랜드에 바로 전달하는 결과 리포트', '운영 규모에 맞춘 요금'], '도입 문의', false],
            ].map(([title, desc, items, cta, primary]) => (
              <article key={title} className="flex-[1_1_340px] bg-white border border-sf-line rounded-[14px] p-7 flex flex-col gap-3.5">
                <h3 className="m-0 text-[22px] font-bold">{title}</h3>
                <p className="m-0 text-base text-sf-body">{desc}</p>
                <ul className="list-none m-0 p-0 flex flex-col gap-2 text-[15px]">{items.map(t => <li key={t} className="flex gap-2"><Check /><span>{t}</span></li>)}</ul>
                <a href="#contact" className={`mt-auto inline-flex items-center justify-center min-h-[48px] px-5 text-base font-bold no-underline border-2 border-sf-ink rounded-[10px] ${primary ? 'text-white bg-sf-ink' : 'text-sf-ink bg-white'}`}>{cta}</a>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="bg-sf-soft border-y border-sf-line">
          <div className={`${wrap} py-[88px] flex flex-col gap-8`}>
            <div className="flex flex-col gap-3">
              <h2 className={h2}>요금은 단순하게</h2>
              <p className="m-0 text-lg text-sf-body">캠페인 규모에 맞춰 고르고, 늘어나면 올리세요. 부가세 별도.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {PLANS.map(p => (
                <article key={p.name} className={`sf-pc flex-[1_1_230px] bg-white rounded-[14px] p-6 flex flex-col gap-3.5 ${p.primary ? 'border-2 border-sf-ink' : 'border border-sf-line'}`}>
                  <h3 className="m-0 text-lg font-bold">{p.name}{p.badge && <span className="ml-1.5 px-2.5 py-0.5 text-[13px] font-bold bg-sf-accent rounded-full align-middle">{p.badge}</span>}</h3>
                  <p className="m-0 font-plexmono text-[32px] font-medium leading-[1.1] tracking-[-0.03em]">{p.price}{p.unit && <span className="font-plex text-[15px] font-normal tracking-normal text-sf-sub"> {p.unit}</span>}</p>
                  <p className="m-0 text-[15px] text-sf-body">{p.desc}</p>
                  <ul className="list-none m-0 p-0 flex flex-col gap-2 text-[15px]">{p.items.map(t => <li key={t} className="flex gap-2"><Check /><span>{t}</span></li>)}</ul>
                  <a href="#contact" className={`mt-auto inline-flex items-center justify-center min-h-[48px] px-5 text-base font-bold no-underline border-2 border-sf-ink rounded-[10px] ${p.primary ? 'text-white bg-sf-ink' : 'text-sf-ink bg-white'}`}>{p.cta}</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="max-w-[820px] mx-auto px-6 py-24 flex flex-col gap-6">
          <h2 className={h2}>자주 묻는 질문</h2>
          <div className="border-t-2 border-sf-ink">
            {FAQ.map(([q, a]) => (
              <details key={q} className="border-b border-sf-line">
                <summary className="py-5 text-lg font-bold">{q}</summary>
                <p className="m-0 pb-5 text-base text-sf-body">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contact" className="sf-dark bg-sf-ink text-white">
          <div className={`${wrap} py-[88px] flex flex-wrap gap-12`}>
            <div className="flex-[1_1_360px] flex flex-col gap-4">
              <h2 className="m-0 text-[clamp(28px,3.6vw,42px)] leading-[1.25] tracking-[-0.03em] font-bold">전체 리스트와 함께<br />상담을 받아보세요</h2>
              <p className="m-0 text-[17px] text-sf-dim">분석한 제품 기준의 인플루언서 전체 리스트와 진행 방식, 견적을 담당자가 정리해 보내드립니다.{CONTACT_DAYS ? ` 영업일 기준 ${CONTACT_DAYS}일 안에 연락드립니다.` : ''}</p>
            </div>
            <ContactForm product={product} setProduct={setProduct} analysis={run && resp && !resp.error ? { url: run.url, country: run.country, keyword: [resp.keyword, ...(resp.matchedKeywords || [])].filter(Boolean).join(', ') } : null} />
          </div>
        </section>
      </main>

      <footer className={`${wrap} py-8 flex flex-wrap justify-between gap-3 text-sm text-sf-sub`}>
        <address className="not-italic flex flex-col gap-1">
          <span>스튜디오1216 · 사업자등록번호 825-16-02903</span>
          <span>(04785) 서울특별시 성동구 뚝섬로13길 38 (성수동2가 271-1) KT&amp;G 상상플래닛</span>
          <span>(42956) 대구 달성군 화원읍 성천로 5 달성청년혁신센터</span>
          <span>© 2026 simfle</span>
        </address>
        <a href="/privacy" className="inline-flex items-center min-h-[44px] text-sf-sub">개인정보처리방침</a>
      </footer>
    </div>
  )
}
