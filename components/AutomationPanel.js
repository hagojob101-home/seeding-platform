import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// 관리자 '캠페인 자동화' 탭: 053 화면 → /api/admin/automation → Apps Script 사본(hagojob101로 실행)
async function call(action, ...args) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/admin/automation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ action, args }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || '요청에 실패했습니다.')
  return body.data
}

const input = 'w-full border border-line rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-ink'
const button = 'bg-ink text-white px-5 py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50'
const label = 'block text-sm font-semibold text-ink mb-1'
const hint = 'text-xs text-muted mt-1'

function Status({ state }) {
  if (!state?.msg) return null
  return <p role={state.error ? 'alert' : 'status'} className={`text-sm mt-3 ${state.error ? 'text-ink font-semibold' : 'text-muted'}`}>{state.msg}</p>
}

export default function AutomationPanel() {
  // 1. 캠페인 만들기
  const [url, setUrl] = useState('')
  const [brand, setBrand] = useState('')
  const [brandTouched, setBrandTouched] = useState(false)
  const [brandHint, setBrandHint] = useState('')
  const [creating, setCreating] = useState(false)
  const [createState, setCreateState] = useState(null)
  const [created, setCreated] = useState(null)
  const timer = useRef(null)

  // 2·3. 캠페인 선택 · 이메일 초안 · 초대 발송
  const [campaigns, setCampaigns] = useState([])
  const [ssId, setSsId] = useState('')
  const [subject, setSubject] = useState('')
  const [template, setTemplate] = useState('')
  const [senders, setSenders] = useState([])
  const [sender, setSender] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [emails, setEmails] = useState('')
  const [draftState, setDraftState] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendState, setSendState] = useState(null)
  const [sendResult, setSendResult] = useState(null)
  const [loadError, setLoadError] = useState('')

  const loadCampaigns = () => call('listCampaigns').then(setCampaigns).catch(e => setLoadError(e.message))
  useEffect(() => {
    loadCampaigns()
    call('getSenderOptions').then(list => { setSenders(list); setSender(list[0] || '') }).catch(e => setLoadError(e.message))
  }, [])

  // 상품 URL 입력 → 브랜드명 자동 추출 (직접 고친 뒤에는 건드리지 않음)
  const onUrl = (v) => {
    setUrl(v)
    clearTimeout(timer.current)
    if (brandTouched || !v.trim()) { setBrandHint(''); return }
    setBrandHint('브랜드명 확인 중...')
    timer.current = setTimeout(() => {
      call('guessBrandName', v.trim())
        .then(name => { setBrand(name); setBrandHint('상품 페이지에서 찾았어요. 다르면 직접 고쳐주세요.') })
        .catch(() => setBrandHint('자동으로 찾지 못했어요. 브랜드명을 직접 입력해주세요.'))
    }, 700)
  }

  const create = async (e) => {
    e.preventDefault()
    if (!url.trim()) { setCreateState({ error: true, msg: '상품 URL을 입력해주세요.' }); return }
    setCreating(true); setCreated(null); setCreateState({ msg: '폴더·신청서·가이드를 만드는 중이에요. 최대 1분 걸려요.' })
    try {
      const r = await call('runAutomation', url.trim(), brand.trim())
      setCreated(r); setCreateState(null)
      await loadCampaigns()
      selectCampaign(r.sheetId)
    } catch (err) {
      setCreateState({ error: true, msg: err.message })
    }
    setCreating(false)
  }

  const selectCampaign = async (id) => {
    setSsId(id); setSendResult(null); setSendState(null)
    if (!id) { setSubject(''); setTemplate(''); return }
    setDraftState({ msg: '불러오는 중...' })
    try {
      const d = await call('getCampaignEmail', id)
      setSubject(d.subject); setTemplate(d.template)
      if (d.sender) setSender(d.sender)
      setReplyTo(d.replyTo || '')
      setDraftState(null)
    } catch (err) { setDraftState({ error: true, msg: err.message }) }
  }

  const saveDraft = async () => {
    if (!ssId) { setDraftState({ error: true, msg: '캠페인을 먼저 선택해주세요.' }); return }
    setDraftState({ msg: '저장 중...' })
    try { await call('saveCampaignEmail', ssId, subject, template); setDraftState({ msg: '저장했어요. 이제 이 문구로 발송돼요.' }) }
    catch (err) { setDraftState({ error: true, msg: err.message }) }
  }

  const send = async (e) => {
    e.preventDefault()
    if (!ssId) { setSendState({ error: true, msg: '캠페인을 먼저 선택해주세요.' }); return }
    if (!emails.trim()) { setSendState({ error: true, msg: '받는 사람 이메일을 입력해주세요.' }); return }
    setSending(true); setSendResult(null); setSendState({ msg: '발송 중이에요...' })
    try {
      const r = await call('sendInviteEmails', ssId, emails, sender, replyTo.trim())
      setSendResult(r); setSendState(null)
      if (!r.failed.length) setEmails('')
    } catch (err) { setSendState({ error: true, msg: err.message }) }
    setSending(false)
  }

  const links = created && [
    ['브랜드 폴더', created.folderUrl], ['신청서(공개)', created.formUrl], ['신청서 편집', created.formEditUrl],
    ['응답 스프레드시트', created.sheetUrl], ['콘텐츠 가이드', created.guideUrl],
  ]

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-lg font-bold text-ink">캠페인 자동화</h2>
        <p className="text-sm text-muted mt-1">상품 URL만 넣으면 폴더·신청서·응답시트·가이드를 만들고, 인플루언서 초대 메일을 보낼 수 있어요. 모두 hagojob101 계정으로 만들어지고 발송돼요.</p>
        {loadError && <p role="alert" className="text-sm text-ink font-semibold mt-3">{loadError}</p>}
      </div>

      {/* 1. 캠페인 만들기 */}
      <form onSubmit={create} className="bg-white border border-line rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-ink">1. 캠페인 만들기</h3>
        <div>
          <label htmlFor="am-url" className={label}>상품 URL</label>
          <input id="am-url" type="url" value={url} onChange={e => onUrl(e.target.value)} placeholder="https://brand.com/product/123" className={input} />
        </div>
        <div>
          <label htmlFor="am-brand" className={label}>브랜드명</label>
          <input id="am-brand" value={brand} onChange={e => { setBrand(e.target.value); setBrandTouched(true); setBrandHint('') }} placeholder="URL을 넣으면 자동으로 채워져요" className={input} />
          {brandHint && <p className={hint} aria-live="polite">{brandHint}</p>}
        </div>
        <button type="submit" disabled={creating} className={button}>{creating ? '만드는 중...' : '시작하기'}</button>
        <Status state={createState} />
        {created && (
          <div className="bg-highlight rounded-xl p-4 text-sm">
            <p className="font-semibold text-ink mb-2">[{created.brand}] 캠페인 준비 완료 · 업로드 마감 {created.deadline}</p>
            <ul className="space-y-1">
              {links.map(([name, href]) => <li key={name}><a href={href} target="_blank" rel="noreferrer" className="text-ink underline">{name}</a></li>)}
            </ul>
          </div>
        )}
      </form>

      {/* 2. 캠페인 선택 · 이메일 초안 */}
      <div className="bg-white border border-line rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-ink">2. 이메일 초안</h3>
        <div>
          <label htmlFor="am-campaign" className={label}>캠페인(브랜드)</label>
          <select id="am-campaign" value={ssId} onChange={e => selectCampaign(e.target.value)} className={input}>
            <option value="">캠페인을 선택하세요</option>
            {campaigns.map(c => <option key={c.ssId} value={c.ssId}>{c.brand}{c.createdAt ? ` · ${c.createdAt.slice(0, 10)}` : ''}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="am-subject" className={label}>제목</label>
          <input id="am-subject" value={subject} onChange={e => setSubject(e.target.value)} disabled={!ssId} className={input} />
        </div>
        <div>
          <label htmlFor="am-template" className={label}>본문</label>
          <textarea id="am-template" value={template} onChange={e => setTemplate(e.target.value)} disabled={!ssId} rows={9} className={input} />
          <p className={hint}>{'{{이름}}'}은 받는 사람 이름으로 바뀌어요. 여기서 고치면 초대 발송과 응답시트 자동발송 모두에 반영돼요.</p>
        </div>
        <button type="button" onClick={saveDraft} disabled={!ssId} className={button}>초안 저장</button>
        <Status state={draftState} />
      </div>

      {/* 3. 초대 발송 */}
      <form onSubmit={send} className="bg-white border border-line rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-ink">3. 인플루언서 초대 메일 보내기</h3>
        <div>
          <label htmlFor="am-emails" className={label}>받는 사람 이메일</label>
          <textarea id="am-emails" value={emails} onChange={e => setEmails(e.target.value)} rows={4} placeholder={'influencer1@example.com\ninfluencer2@example.com'} className={input} />
          <p className={hint}>여러 명은 줄바꿈이나 쉼표로 구분해요.</p>
        </div>
        <div>
          <label htmlFor="am-sender" className={label}>보내는 주소</label>
          <select id="am-sender" value={sender} onChange={e => setSender(e.target.value)} className={input}>
            {senders.length ? senders.map(a => <option key={a} value={a}>{a}</option>) : <option value="">기본 주소</option>}
          </select>
          <p className={hint}>hagojob101 Gmail 설정의 '다른 주소에서 메일 보내기'에 등록된 주소만 나와요.</p>
        </div>
        <div>
          <label htmlFor="am-reply" className={label}>회신 받을 주소 (선택)</label>
          <input id="am-reply" type="email" value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="비우면 보내는 주소로 회신돼요" className={input} />
          <p className={hint}>선택한 캠페인에 저장돼서 응답시트 자동발송에도 같은 주소가 쓰여요.</p>
        </div>
        <button type="submit" disabled={sending} className={button}>{sending ? '발송 중...' : '초대 메일 발송'}</button>
        <Status state={sendState} />
        {sendResult && (
          <div role="status" className="bg-highlight rounded-xl p-4 text-sm text-ink">
            <p className="font-semibold">발송 {sendResult.sent.length}건{sendResult.failed.length ? ` · 실패 ${sendResult.failed.length}건` : ''}</p>
            {sendResult.failed.map(f => <p key={f} className="text-muted mt-1">{f}</p>)}
          </div>
        )}
      </form>
    </div>
  )
}
