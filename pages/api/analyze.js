import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import dns from 'dns'
import net from 'net'
import http from 'http'
import https from 'https'
import zlib from 'zlib'

export const config = { api: { bodyParser: { sizeLimit: '8kb' } } }

const COUNTRIES = ['KR', 'BR']
const HOURLY_LIMIT = 20
const MAX_REDIRECTS = 3
const TIMEOUT_MS = 5000
const MAX_BYTES = 500 * 1024

// 사설·루프백·링크로컬 등 외부가 아닌 대역 (SSRF 차단)
const blocked = new net.BlockList()
for (const [a, p] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16], ['224.0.0.0', 3]]) blocked.addSubnet(a, p, 'ipv4')
for (const [a, p] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]]) blocked.addSubnet(a, p, 'ipv6')

const isBlocked = (ip) => {
  const v4 = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1]
  if (v4) ip = v4
  const family = net.isIP(ip)
  return !family || blocked.check(ip, family === 4 ? 'ipv4' : 'ipv6')
}

// 연결 직전에 실제 접속할 주소를 검사 → DNS 재바인딩으로도 우회 불가
function safeLookup(hostname, options, cb) {
  dns.lookup(hostname, { ...options, all: true }, (err, addrs) => {
    if (err) return cb(err)
    if (!addrs.length || addrs.some(a => isBlocked(a.address))) return cb(Object.assign(new Error('blocked'), { code: 'BLOCKED' }))
    options.all ? cb(null, addrs) : cb(null, addrs[0].address, addrs[0].family)
  })
}

class Fail extends Error {
  constructor(status, message) { super(message); this.status = status }
}

function checkUrl(u) {
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw new Fail(400, '이 주소는 분석할 수 없습니다.')
  if (u.port && !['80', '443'].includes(u.port)) throw new Fail(400, '이 주소는 분석할 수 없습니다.')
  const host = u.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(host) && isBlocked(host)) throw new Fail(400, '이 주소는 분석할 수 없습니다.')
}

function request(u, signal) {
  return new Promise((resolve, reject) => {
    const req = (u.protocol === 'https:' ? https : http).get(u, {
      lookup: safeLookup,
      signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; simfle-analyzer/1.0)', accept: 'text/html', 'accept-encoding': 'gzip, deflate, br' },
    }, resolve)
    req.on('error', reject)
  })
}

function readBody(res, signal) {
  const enc = res.headers['content-encoding']
  const stream = enc === 'gzip' ? res.pipe(zlib.createGunzip()) : enc === 'deflate' ? res.pipe(zlib.createInflate()) : enc === 'br' ? res.pipe(zlib.createBrotliDecompress()) : res
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    const done = () => { res.destroy(); resolve(Buffer.concat(chunks).subarray(0, MAX_BYTES)) }
    stream.on('data', c => { chunks.push(c); size += c.length; if (size >= MAX_BYTES) { stream.removeAllListeners('data'); done() } })
    stream.on('end', done)
    stream.on('error', reject)
    res.on('error', reject)
    signal.addEventListener('abort', () => reject(new Error('timeout')))
  })
}

async function fetchHtml(startUrl) {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
  try {
    let u = startUrl
    for (let i = 0; ; i++) {
      checkUrl(u)
      const res = await request(u, ac.signal)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        if (i >= MAX_REDIRECTS) throw new Fail(422, '제품 페이지를 읽지 못했습니다.')
        u = new URL(res.headers.location, u)
        continue
      }
      const type = res.headers['content-type'] || ''
      if (res.statusCode !== 200 || !/text\/html/i.test(type)) { res.resume(); throw new Fail(422, '제품 페이지를 읽지 못했습니다.') }
      const buf = await readBody(res, ac.signal)
      const charset = type.match(/charset=["']?([\w-]+)/i)?.[1] || buf.subarray(0, 2048).toString('latin1').match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
      try { return new TextDecoder(charset || 'utf-8').decode(buf) } catch { return new TextDecoder().decode(buf) }
    }
  } catch (e) {
    if (e instanceof Fail) throw e
    if (e.code === 'BLOCKED') throw new Fail(400, '이 주소는 분석할 수 없습니다.')
    throw new Fail(422, '제품 페이지를 읽지 못했습니다.')
  } finally {
    clearTimeout(timer)
  }
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const decode = s => s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e) => {
  if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m
  const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)
  return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m
})
// 앞뒤 구분 기호 제거 (예: '| LANEIGE ...')
const clean = s => (s ? decode(s).replace(/\s+/g, ' ').replace(/^[\s|\-–—·:]+|[\s|\-–—·:]+$/g, '').slice(0, 500) : '') || null

function extract(html) {
  const metas = {}
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = {}
    for (const [, k, , dq, sq] of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) attrs[k.toLowerCase()] = dq ?? sq
    const key = (attrs.property || attrs.name || '').toLowerCase()
    if (key && attrs.content != null && !(key in metas)) metas[key] = attrs.content
  }
  return {
    title: clean(metas['og:title']) || clean(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]),
    description: clean(metas['og:description']) || clean(metas.description),
    keywords: clean(metas.keywords),
  }
}

const norm = s => (s || '').normalize('NFC').toLowerCase().replace(/\s+/g, '')

function clientIp(req) {
  return req.headers['x-real-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: '허용되지 않은 요청입니다.' }) }

  const { url, country } = req.body || {}
  if (!COUNTRIES.includes(country)) return res.status(400).json({ error: '국가를 선택해 주세요.' })
  let target
  try {
    if (typeof url !== 'string' || url.length > 2000) throw 0
    target = new URL(url.trim())
    if (!['http:', 'https:'].includes(target.protocol)) throw 0
  } catch { return res.status(400).json({ error: '올바른 제품 페이지 주소(http/https)를 입력해 주세요.' }) }

  const salt = process.env.ANALYZE_IP_SALT
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!salt || !key) { console.error('analyze: ANALYZE_IP_SALT 또는 SUPABASE_SERVICE_ROLE_KEY 없음'); return res.status(500).json({ error: '잠시 후 다시 시도해 주세요.' }) }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } })
  const ip_hash = crypto.createHash('sha256').update(salt + clientIp(req)).digest('hex')

  const since = new Date(Date.now() - 3600_000).toISOString()
  const { count, error: countErr } = await db.from('analyze_requests').select('id', { count: 'exact', head: true }).eq('ip_hash', ip_hash).gte('created_at', since)
  if (countErr) { console.error('analyze count', countErr); return res.status(500).json({ error: '잠시 후 다시 시도해 주세요.' }) }
  if (count >= HOURLY_LIMIT) return res.status(429).json({ error: '분석 요청이 많습니다. 1시간 뒤에 다시 시도해 주세요.' })

  const log = { ip_hash, country, host: target.hostname.slice(0, 255), title: null, matched_keyword: null }
  const [status, body] = await analyze(db, target, country, log)
  // 응답 전에 기록 (서버리스는 응답 후 실행이 멈출 수 있음)
  const { error } = await db.from('analyze_requests').insert(log)
  if (error) console.error('analyze log', error)
  return res.status(status).json(body)
}

async function analyze(db, target, country, log) {
  try {
    const { title, description, keywords: pageKeywords } = extract(await fetchHtml(target))
    log.title = title

    const { data: keywords, error } = await db.from('ad_keywords').select('keyword, category, collected_on, ads, accounts, collab, brand').eq('country', country)
    if (error) throw error

    // 제목·설명·페이지 키워드에 들어 있는 검색어 전부(최대 5개). 대표 = 가장 긴 것, 같으면 accounts 큰 쪽
    const text = norm(`${title || ''} ${description || ''} ${pageKeywords || ''}`)
    const hits = keywords
      .filter(k => norm(k.keyword) && text.includes(norm(k.keyword)))
      .sort((a, b) => norm(b.keyword).length - norm(a.keyword).length || (b.accounts ?? 0) - (a.accounts ?? 0))
      .slice(0, 5)
    if (!hits.length) return [200, { matched: false, title }]
    const [hit] = hits
    const hitNames = hits.map(k => k.keyword)
    log.matched_keyword = hitNames.join(', ').slice(0, 500)

    const related = hit.category
      ? keywords.filter(k => k.category === hit.category && !hitNames.includes(k.keyword)).sort((a, b) => (b.accounts ?? 0) - (a.accounts ?? 0)).slice(0, 5).map(k => k.keyword)
      : []

    // 명단은 서버에만: 응답에는 2명 + 나머지 개수만 (맞은 검색어 전체, 계정 중복 제거)
    const { data: rows, error: infErr } = await db.from('ad_influencers').select('handle, brand, followers, type, keyword').eq('country', country).in('keyword', hitNames)
    if (infErr) throw infErr
    const score = r => (r.type === '협업' ? 4 : 0) + (r.brand ? 2 : 0) + (r.keyword === hit.keyword ? 1 : 0)
    const unique = [...new Map([...rows].sort((a, b) => score(a) - score(b)).map(r => [r.handle, r])).values()]
    const influencers = unique.sort((a, b) => score(b) - score(a)).slice(0, 2).map(({ handle, brand, followers, keyword }) => ({ handle, brand, followers, keyword }))

    return [200, {
      matched: true, title, keyword: hit.keyword, matchedKeywords: hitNames.slice(1), category: hit.category, related, collectedOn: hit.collected_on,
      stats: { ads: hit.ads, accounts: hit.accounts, collab: hit.collab, brand: hit.brand },
      influencers, lockedCount: unique.length - influencers.length,
    }]
  } catch (e) {
    if (e instanceof Fail) return [e.status, { error: e.message }]
    console.error('analyze', e)
    return [500, { error: '분석 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.' }]
  }
}
