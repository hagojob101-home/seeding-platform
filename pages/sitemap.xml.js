import { POSTS } from '../lib/posts'
import { SITE_URL } from '../components/SfLayout'

export async function getServerSideProps({ res }) {
  const urls = [['/', null], ['/blog', POSTS[0]?.date], ...POSTS.map(p => [`/blog/${p.slug}`, p.updated || p.date]), ['/privacy', null]]
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600')
  res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `  <url><loc>${SITE_URL}${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`)
  return { props: {} }
}

export default function Sitemap() { return null }
