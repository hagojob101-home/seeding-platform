import Head from 'next/head'
import fs from 'fs'
import path from 'path'
import { POSTS } from '../../../lib/posts'
import { parseMd, Md } from '../../../lib/md'
import { SfHeader, SfFooter, SITE_URL, SF, sfWrap } from '../../../components/SfLayout'

export const getStaticPaths = () => ({ paths: POSTS.map(p => ({ params: { slug: p.slug } })), fallback: false })
// 빌드할 때 content/blog/<slug>.md 를 읽음. 이전 글 = 더 오래된 글, 다음 글 = 더 최근 글
export function getStaticProps({ params }) {
  const i = POSTS.findIndex(p => p.slug === params.slug)
  const doc = parseMd(fs.readFileSync(path.join(process.cwd(), 'content/blog', `${params.slug}.md`), 'utf8'))
  const link = p => (p ? { slug: p.slug, title: p.title } : null)
  return { props: { post: POSTS[i], doc, prev: link(POSTS[i + 1]), next: link(POSTS[i - 1]) } }
}

export default function Post({ post, doc, prev, next }) {
  const faq = doc.faq.length ? doc.faq : null
  const url = `${SITE_URL}/blog/${post.slug}`
  const ld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: post.title, description: post.description, datePublished: post.date, dateModified: post.updated || post.date,
    mainEntityOfPage: url, author: { '@type': 'Organization', name: 'simfle', url: SITE_URL }, publisher: { '@type': 'Organization', name: 'simfle', url: SITE_URL },
  }).replace(/</g, '\\u003c')
  const faqLd = faq && JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }).replace(/</g, '\\u003c')
  return (
    <div className="sf font-plex text-sf-ink bg-white leading-[1.6] break-keep">
      <Head>
        <title>{`${post.title} — simfle`}</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={url} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
        {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqLd }} />}
      </Head>
      <SfHeader />
      <main className={`${sfWrap} max-w-[820px] py-24`}>
        <article className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <a href={`${SF}/blog`} className="self-start inline-flex items-center min-h-[44px] text-sm text-sf-sub">← 블로그</a>
            <h1 className="m-0 text-[clamp(28px,3.8vw,44px)] leading-[1.25] tracking-[-0.03em] font-bold">{post.title}</h1>
            <time dateTime={post.date} className="font-plexmono text-sm text-sf-sub">{post.date}{post.updated ? ` · 수정 ${post.updated}` : ''}</time>
          </header>
          <div className="sf-prose"><Md doc={doc} /></div>
          <a href={`${SF}#contact`} className="self-start inline-flex items-center min-h-[52px] px-7 font-bold no-underline text-sf-ink bg-sf-accent border-2 border-sf-ink rounded-[10px]">상담 신청</a>
        </article>
        {(prev || next) && (
          <nav aria-label="이전 글과 다음 글" className="mt-16 grid sm:grid-cols-2 gap-4 border-t-2 border-sf-ink pt-6">
            {prev ? (
              <a href={`${SF}/blog/${prev.slug}`} className="flex flex-col gap-1 min-h-[44px] no-underline text-sf-ink hover:text-[#444]">
                <span className="text-sm text-sf-sub">← 이전 글</span><span className="font-bold">{prev.title}</span>
              </a>
            ) : <span />}
            {next && (
              <a href={`${SF}/blog/${next.slug}`} className="flex flex-col gap-1 min-h-[44px] no-underline text-sf-ink hover:text-[#444] sm:text-right">
                <span className="text-sm text-sf-sub">다음 글 →</span><span className="font-bold">{next.title}</span>
              </a>
            )}
          </nav>
        )}
      </main>
      <SfFooter />
    </div>
  )
}
