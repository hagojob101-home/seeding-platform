import Head from 'next/head'
import { POSTS } from '../../../lib/posts'
import { SfHeader, SfFooter, SITE_URL, SF, sfWrap } from '../../../components/SfLayout'

export default function Blog() {
  return (
    <div className="sf font-plex text-sf-ink bg-white leading-[1.6] break-keep">
      <Head>
        <title>블로그 — simfle</title>
        <meta name="description" content="인플루언서 시딩과 Meta 광고 협업에 대한 simfle의 글." />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
      </Head>
      <SfHeader />
      <main className={`${sfWrap} max-w-[820px] py-24 flex flex-col gap-10`}>
        <h1 className="m-0 text-[clamp(28px,3.8vw,44px)] leading-[1.25] tracking-[-0.03em] font-bold">블로그</h1>
        {POSTS.length ? (
          <ul className="list-none m-0 p-0 border-t-2 border-sf-ink">
            {POSTS.map(p => (
              <li key={p.slug} className="border-b border-sf-line">
                <a href={`${SF}/blog/${p.slug}`} className="block py-6 no-underline text-sf-ink hover:text-[#444]">
                  <time dateTime={p.date} className="font-plexmono text-sm text-sf-sub">{p.date}</time>
                  <h2 className="m-0 mt-1 text-xl font-bold">{p.title}</h2>
                  <p className="m-0 mt-2 text-base text-sf-body">{p.description}</p>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-lg text-sf-body">첫 글을 준비하고 있습니다.</p>
        )}
      </main>
      <SfFooter />
    </div>
  )
}
