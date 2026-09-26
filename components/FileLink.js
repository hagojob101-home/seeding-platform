import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// 비공개 버킷 파일 → 1시간짜리 서명 URL
export async function signedUrl(path) {
  if (!path || path.startsWith('http')) return path || null
  const { data } = await supabase.storage.from('influencer-files').createSignedUrl(path, 3600)
  return data?.signedUrl || null
}

export default function FileLink({ path, className, children }) {
  const [url, setUrl] = useState(null)
  useEffect(() => { signedUrl(path).then(setUrl) }, [path])
  if (!url) return <span className={className} aria-disabled="true">{children}</span>
  return <a href={url} target="_blank" rel="noreferrer" className={className}>{children}</a>
}
