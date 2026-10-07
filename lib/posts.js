// 블로그 글 목록 (최신이 위). 새 글: content/blog/<slug>.md 를 넣고 여기 한 줄 추가
// 본문은 마크다운(lib/md.js가 읽는 범위): ## / ### 제목, 문단, - / 1. 목록, **굵게**, [글](url), 각주 [n] + 정의 [n]: url "제목"
// { slug, title, description: '검색 결과·AI 요약에 쓰일 한두 문장', date: 'YYYY-MM-DD', updated?: 'YYYY-MM-DD' }
export const POSTS = [
  {
    slug: 'what-is-simfle',
    title: 'simfle은 어떤 서비스인가요? 제품 URL 기반 인플루언서 탐색의 출발점',
    description: 'simfle은 제품 URL로 Meta 광고에 등장한 인플루언서를 찾고, 섭외·계약서·업로드 확인·정산까지 대신 운영하는 인플루언서 시딩 플랫폼입니다. 한국과 브라질을 지원합니다.',
    date: '2026-09-29',
  },
  {
    slug: 'seeding-platform-vs-agency',
    title: '인플루언서 시딩 플랫폼과 대행사: 우리 팀에 맞는 선택 기준',
    description: '시딩 플랫폼과 대행사를 고를 때 이름보다 업무 단계별로 누가 무엇을 책임지는지 비교하는 방법과, 견적서·계약서에서 확인할 항목을 정리했습니다.',
    date: '2026-09-22',
  },
  {
    slug: 'meta-ad-library-influencer-search',
    title: 'Meta 광고 라이브러리로 인플루언서 후보를 탐색하는 방법과 한계',
    description: 'Meta 광고 라이브러리에서 광고에 등장한 크리에이터를 후보로 추리는 절차와, 광고 이력만으로 알 수 없는 것을 정리했습니다.',
    date: '2026-09-15',
  },
  {
    slug: 'find-influencers-by-product-url',
    title: '제품 URL로 인플루언서를 찾는 방법: 카테고리 분석부터 후보 검토까지',
    description: '제품 페이지에서 카테고리와 검색어를 뽑아 여러 경로로 인플루언서 후보를 찾고 직접 검토하는 순서를 정리했습니다.',
    date: '2026-09-08',
  },
  {
    slug: 'influencer-seeding',
    title: '인플루언서 시딩이란? 제품 협찬·유료 광고와의 차이',
    description: '인플루언서 시딩의 정의와 제품 협찬·유료 광고 협업의 차이, 제품을 보내기 전에 정해야 할 다섯 가지를 정리했습니다.',
    date: '2026-09-01',
  },
]
