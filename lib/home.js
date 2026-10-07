import { useEffect, useState } from 'react'

// 로그인 화면의 '홈' 버튼: simfle에서 /login?from=simfle 로 들어오면 이 탭에서는 simfle 홈, 그 외(053)는 053 홈
// /login 이 들어온 경로를 기록하고, 이어지는 로그인 화면들은 그 기록을 읽는다
const KEY = 'login-from'

export function useHome() {
  const [simfle, setSimfle] = useState(false)
  useEffect(() => {
    try {
      if (location.pathname === '/login') {
        const from = new URLSearchParams(location.search).get('from')
        from === 'simfle' ? sessionStorage.setItem(KEY, 'simfle') : sessionStorage.removeItem(KEY)
      }
      setSimfle(sessionStorage.getItem(KEY) === 'simfle')
    } catch {}
  }, [])
  return simfle ? { href: '/simfle', label: 'simfle' } : { href: '/', label: '053 Meta' }
}
