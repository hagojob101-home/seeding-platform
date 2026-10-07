// 블로그 글용 최소 마크다운 (라이브러리 없이): ## / ### 제목, 문단, - 목록, 1. 목록, **굵게**, [글](url), 각주 [n] + 정의 [n]: url "제목"
// '# 제목'은 POSTS의 title을 쓰므로 버리고, '참고 자료'·'출처' 아래 문단은 각주 목록으로 대신한다. '자주 묻는 질문'의 ### 질문 + 문단은 faq로 뽑는다.
const REF_DEF = /^\[(\d+)\]:\s*(https?:\/\/\S+)\s+"(.+)"\s*$/

export function parseMd(src) {
  const blocks = [], refs = [], faq = []
  let section = '', list = null, para = []
  const flush = () => { if (para.length) blocks.push({ t: 'p', text: para.join(' ') }); para = []; list = null }

  for (const raw of src.split('\n')) {
    const line = raw.trim()
    const def = line.match(REF_DEF)
    if (def) { flush(); refs.push({ n: def[1], url: def[2], label: def[3] }); continue }
    if (!line) { flush(); continue }
    const h = line.match(/^(#{1,3})\s+(.+)/)
    if (h) {
      flush()
      if (h[1] === '#') continue
      if (h[1] === '##') section = h[2]
      if (/^(참고 자료|출처)$/.test(section) && h[1] === '##') continue
      blocks.push({ t: h[1] === '##' ? 'h2' : 'h3', text: h[2] })
      continue
    }
    if (/^(참고 자료|출처)$/.test(section)) continue
    const li = line.match(/^(-|\d+\.)\s+(.+)/)
    if (li) {
      const t = li[1] === '-' ? 'ul' : 'ol'
      if (para.length) flush()
      if (!list || list.t !== t) { list = { t, items: [] }; blocks.push(list) }
      list.items.push(li[2])
      continue
    }
    para.push(line)
  }
  flush()

  blocks.forEach((b, i) => {
    const next = blocks.at(i + 1)
    if (b.t === 'h3' && next?.t === 'p' && isFaq(blocks, i)) faq.push([b.text, plain(next.text)])
  })
  return { blocks, refs, faq }
}

// 이 ### 가 '자주 묻는 질문' 아래에 있는지
function isFaq(blocks, i) {
  for (let j = i; j >= 0; j--) if (blocks.at(j).t === 'h2') return blocks.at(j).text === '자주 묻는 질문'
  return false
}

// 구조화 데이터용 평문 (굵게·링크·각주 표시 제거)
export const plain = s => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '$1').replace(/\[\d+\]/g, '').trim()

// 링크: 외부(https://)는 새 탭, 사이트 안(/로 시작)은 같은 탭
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)|\[(\d+)\]/g

export function Inline({ text }) {
  const out = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const k = out.length
    if (m[1]) out.push(<strong key={k}><Inline text={m[1]} /></strong>)
    else if (m[2]) out.push(m[3].startsWith('/') ? <a key={k} href={m[3]}>{m[2]}</a> : <a key={k} href={m[3]} target="_blank" rel="noopener noreferrer">{m[2]}</a>)
    else out.push(<sup key={k}><a href={`#ref-${m[4]}`} aria-label={`참고 자료 ${m[4]}`}>[{m[4]}]</a></sup>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Md({ doc }) {
  return (
    <>
      {doc.blocks.map((b, i) => {
        if (b.t === 'ul' || b.t === 'ol') {
          const List = b.t
          return <List key={i}>{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</List>
        }
        const Tag = b.t
        return <Tag key={i}><Inline text={b.text} /></Tag>
      })}
      {doc.refs.length > 0 && (
        <>
          <h2>참고 자료</h2>
          <ol>
            {doc.refs.map(r => (
              <li key={r.n} id={`ref-${r.n}`} value={+r.n}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.label}</a></li>
            ))}
          </ol>
        </>
      )}
    </>
  )
}
