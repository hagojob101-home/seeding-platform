import Head from 'next/head'
import { POSTS } from '../../../lib/posts'
import { BODIES } from '../../../content/blog'
import { SfHeader, SfFooter, SITE_URL, SF, sfWrap } from '../../../components/SfLayout'

export const getStaticPaths = () => ({ paths: POSTS.map(p => ({ params: { slug: p.slug } })), fallback: false })
export const getStaticProps = ({ params }) => ({ props: { post: POSTS.find(p => p.slug === params.slug) } })

export default function Post({ post }) {
  const { Body, faq } = BODIES[post.slug]
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
          <div className="sf-prose"><Body /></div>
          <a href={`${SF}#contact`} className="self-start inline-flex items-center min-h-[52px] px-7 font-bold no-underline text-sf-ink bg-sf-accent border-2 border-sf-ink rounded-[10px]">상담 신청</a>
        </article>
      </main>
      <SfFooter />
    </div>
  )
}
