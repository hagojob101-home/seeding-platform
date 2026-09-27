// 상태 정의 (DB check 제약과 동일하게 유지)
export const CAMPAIGN_STATUS = ['요청', '진행', '완료', '거절']
export const PARTICIPATION_STEPS = ['신청', '승인', '제품발송', '콘텐츠확인', '업로드확인', '정산요청', '정산완료']
export const PARTICIPATION_STATUS = [...PARTICIPATION_STEPS, '거절']
// 좁은 칸용 짧은 이름 (전체 이름은 상태 배지·툴팁에 표시)
export const STEP_SHORT = { '제품발송': '발송', '콘텐츠확인': '콘텐츠', '업로드확인': '업로드' }
