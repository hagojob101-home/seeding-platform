export default function Footer() {
  return (
    <footer className="bg-white border-t border-line mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div className="text-xs text-muted space-y-0.5">
            <p className="font-medium text-muted">공오삼</p>
            <p>대표자: 유지혜 | 사업자등록번호: 719-25-02333</p>
            <p>서울특별시 성동구 연무장 5길 18 에이치디앤택</p>
          </div>
          <div className="text-xs text-muted flex flex-col items-end gap-0.5">
            <a href="/privacy" className="hover:text-muted transition underline">개인정보처리방침</a>
            <p>© 2025 공오삼. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
