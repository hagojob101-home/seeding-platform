// slug → { Body: 본문 컴포넌트, faq?: [[질문, 답]] } (본문은 <h2>, <p>, <ul> 등 일반 태그로 작성하면 .sf-prose 스타일이 적용됨)
import InfluencerSeeding, { faq as influencerSeedingFaq } from './influencer-seeding'

export const BODIES = {
  'influencer-seeding': { Body: InfluencerSeeding, faq: influencerSeedingFaq },
}
