export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-400 mb-8">시행일: 2025년 1월 1일</p>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">제1조 (개인정보의 처리 목적)</h2>
          <p className="text-gray-600 leading-relaxed">
            공오삼(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <ul className="mt-3 space-y-2 text-gray-600 list-disc list-inside">
            <li>인플루언서 마케팅 캠페인 진행 및 관리</li>
            <li>원고료 정산 및 세금계산서 발행</li>
            <li>계약 체결 및 이행</li>
            <li>서비스 이용에 따른 본인식별 및 인증</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">제2조 (개인정보의 처리 및 보유기간)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">구분</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">수집 항목</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">보유기간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-gray-600 font-medium">인플루언서</td>
                  <td className="px-4 py-3 text-gray-600">이름, 연락처, 주소, 주민등록번호, 계좌번호, 은행명, 예금주, 신분증 사본, 통장 사본, SNS 계정</td>
                  <td className="px-4 py-3 text-gray-600">회원 탈퇴 후 5년</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-600 font-medium">고객사</td>
                  <td className="px-4 py-3 text-gray-600">회사명, 담당자 이메일, 홈페이지, 사업자등록번호, 사업자등록증, 세금계산서 이메일</td>
                  <td className="px-4 py-3 text-gray-600">계약 종료 후 5년</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-600 font-medium">캠페인 콘텐츠</td>
                  <td className="px-4 py-3 text-gray-600">업로드된 영상, 이미지, 계약서</td>
                  <td className="px-4 py-3 text-gray-600">캠페인 종료 후 1년</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">제3조 (개인정보의 제3자 제공)</h2>
          <p className="text-gray-600 leading-relaxed">
            회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">제4조 (개인정보의 파기)</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
          </p>
          <ul className="space-y-2 text-gray-600 list-disc list-inside">
            <li><span className="font-medium">전자적 파일:</span> 복구 불가능한 방법으로 영구 삭제</li>
            <li><span className="font-medium">종이 문서:</span> 분쇄기로 분쇄 또는 소각</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">제5조 (정보주체의 권리·의무 및 행사방법)</h2>
          <p className="text-gray-600 leading-relaxed mb-3">정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
          <ul className="space-y-2 text-gray-600 list-disc list-inside">
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리 정지 요구</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">제6조 (개인정보 보호책임자)</h2>
          <div className="bg-gray-50 rounded-xl p-4 text-gray-600 space-y-1">
            <p><span className="font-medium">회사명:</span> 공오삼</p>
            <p><span className="font-medium">대표자:</span> 유지혜</p>
            <p><span className="font-medium">사업자등록번호:</span> 719-25-02333</p>
            <p><span className="font-medium">주소:</span> 서울특별시 성동구 연무장 5길 18 에이치디앤택</p>
            <p><span className="font-medium">개인정보 관련 문의:</span> 대표자에게 직접 문의</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">제7조 (개인정보의 안전성 확보조치)</h2>
          <p className="text-gray-600 leading-relaxed">
            회사는 개인정보의 안전성 확보를 위해 SSL 암호화 통신, 접근 권한 관리, 개인정보 취급자 최소화 등의 조치를 취하고 있습니다.
          </p>
        </section>

        <p className="text-sm text-gray-400 mt-8 pt-6 border-t">본 방침은 2025년 1월 1일부터 시행됩니다.</p>
      </div>
    </div>
  )
}
