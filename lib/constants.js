// 상태 정의 (DB check 제약과 동일하게 유지)
export const CAMPAIGN_STATUS = ['요청', '진행', '완료', '거절']
export const PARTICIPATION_STEPS = ['신청', '승인', '제품발송', '콘텐츠확인', '업로드확인', '정산요청', '정산완료']
export const PARTICIPATION_STATUS = [...PARTICIPATION_STEPS, '거절']
