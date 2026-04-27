import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    const chips = document.querySelectorAll('.channel-chip')
    chips.forEach(c => c.addEventListener('click', () => {
      c.classList.toggle('active')
    }))

    const form = document.getElementById('leadForm')
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const managerName = document.getElementById('managerName')?.value || ''
        const jobTitle = document.getElementById('jobTitle')?.value || ''
        const phoneNumber = document.getElementById('phoneNumber')?.value || ''
        const snsUrl = document.getElementById('snsUrl')?.value || ''
        const websiteUrl = document.getElementById('websiteUrl')?.value || ''
        const inquiryMessage = document.getElementById('inquiryMessage')?.value || ''

        try {
          const res = await fetch('/api/consultation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              manager_name: managerName,
              job_title: jobTitle,
              phone_number: phoneNumber,
              sns_url: snsUrl,
              website_url: websiteUrl,
              inquiry_message: inquiryMessage,
            })
          })
          if (!res.ok) throw new Error('서버 오류')
          form.classList.add('hidden')
          document.getElementById('successMsg').classList.remove('hidden')
          alert('정상적으로 접수되었습니다. 3시간 이내로 연락드립니다!')
        } catch (err) {
          alert('오류가 발생했습니다. 다시 시도해주세요.')
        }
      })
    }
  }, [])

  return (
    <>
      <Head>
        <title>053 메타 광고 에이전시</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
        <style>{`
          body { font-family: 'Noto Sans KR', sans-serif; background-color: #050505; color: white; margin: 0; line-height: 1.7; overflow-x: hidden; }
          html { scroll-behavior: smooth; }
          .text-gradient { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .input-dark { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.3s ease; }
          .input-dark:focus { border-color: #3b82f6; background: rgba(255, 255, 255, 0.08); outline: none; }
          .channel-chip { cursor: pointer; transition: all 0.2s; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255,255,255,0.05); }
          .channel-chip.active { background-color: #2563eb; border-color: #3b82f6; color: white; }
        `}</style>
      </Head>

      <nav className="fixed w-full z-[100] transition-all duration-500 py-8">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="text-3xl font-black text-gradient">053</span>
            <span className="text-xl font-light tracking-[0.3em] text-gray-300 uppercase ml-1">Meta</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-gray-300 hover:text-white px-6 py-3 rounded-full text-sm font-bold transition-all border border-white/10 hover:border-white/30">시딩 플랫폼</a>
            <a href="#apply" className="bg-blue-600 text-white px-4 md:px-8 py-2 md:py-3 rounded-full text-xs md:text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap">컨설팅 신청</a>
          </div>
        </div>
      </nav>

      <section className="relative h-screen flex items-center pt-20">
        <div className="absolute inset-0 z-0" dangerouslySetInnerHTML={{__html: `
          <script type="module" src="https://unpkg.com/@splinetool/viewer@1.0.93/build/spline-viewer.js"></script>
          <spline-viewer url="https://prod.spline.design/YvZ1-d16xfXxsqph/scene.splinecode"></spline-viewer>
        `}} />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10 pointer-events-none"></div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-7xl lg:text-[80px] font-black leading-[1.5] mb-8 tracking-tight">
              성장이 멈춘<br/>브랜드를 위한<br/><span className="text-blue-500">확실한 해답</span>
            </h1>
            <p className="text-base md:text-2xl text-gray-400 mb-10 leading-[1.8] max-w-2xl font-medium">
              단순 집행은 누구나 합니다. 053은 지표로 증명합니다.<br/>
              ROAS 800% 이상의 실제 사례가 보여주는 압도적 차이.
            </p>
            <a href="#apply" className="bg-white text-black px-8 md:px-12 py-4 md:py-6 rounded-2xl font-black text-lg md:text-xl hover:scale-105 transition-all inline-block">무료 성과 진단</a>
          </div>
        </div>
      </section>

      {/* 서비스 소개 섹션 */}
      <section className="py-32 bg-[#080808] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">

          {/* 타겟 공감 헤드라인 */}
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-600/20 text-blue-400 font-bold text-sm px-4 py-2 rounded-full mb-6 tracking-widest uppercase border border-blue-500/30">For Small Business</span>
            <h2 className="text-3xl md:text-6xl font-black mb-6 break-keep" style={{lineHeight: "1.4"}}>
              메타 광고, 들어는 봤는데<br/>
              <span className="text-gradient">전혀 감이 안 오시나요?</span>
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
              소상공인, 1인 기업, 상품 하나뿐인 브랜드,<br/>
              마케팅을 처음 시작하는 대표님을 위해 만들었습니다.
            </p>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl px-6 py-4">
              <span className="text-2xl">⚡</span>
              <span className="text-white font-bold text-lg">메타 광고 집행부터 인플루언서 관리까지, 한 번에.</span>
            </div>
          </div>

          {/* 타겟 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
            {[
              { icon: '🏪', text: '소상공인' },
              { icon: '👤', text: '1인 기업' },
              { icon: '📦', text: '상품 1개뿐인 브랜드' },
              { icon: '🚀', text: '마케팅 처음 시작하는 대표님' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition">
                <p className="text-4xl mb-3">{item.icon}</p>
                <p className="text-white font-semibold text-sm">{item.text}</p>
              </div>
            ))}
          </div>

          {/* 한번에 해결 */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-3xl p-10 mb-24 text-center">
            <h3 className="text-2xl md:text-3xl font-black text-white mb-4 break-keep">
              광고 집행 + 인플루언서 관리<br/>
              <span className="text-blue-400">한 플랫폼에서 한 번에</span>
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              따로따로 관리하느라 지치셨나요? 053에서는 메타 광고 성과와 인플루언서 시딩을 동시에 운영하고 한눈에 확인할 수 있습니다.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-8 w-full max-w-sm mx-auto">
              <div className="flex flex-col items-center justify-start bg-white/5 rounded-xl p-3">
                <p className="text-lg md:text-3xl font-black text-blue-400 leading-tight">ROAS</p>
                <p className="text-lg md:text-3xl font-black text-blue-400 leading-tight">800%+</p>
                <p className="text-gray-400 text-xs mt-1 text-center">메타 광고 실제 사례</p>
              </div>
              <div className="flex flex-col items-center justify-start bg-white/5 rounded-xl p-3">
                <p className="text-lg md:text-3xl font-black text-purple-400 leading-tight">3시간</p>
                <p className="text-lg md:text-3xl font-black text-purple-400 leading-tight invisible">-</p>
                <p className="text-gray-400 text-xs mt-1 text-center">이내 담당자 연락</p>
              </div>
              <div className="flex flex-col items-center justify-start bg-white/5 rounded-xl p-3">
                <p className="text-lg md:text-3xl font-black text-green-400 leading-tight">100%</p>
                <p className="text-lg md:text-3xl font-black text-green-400 leading-tight invisible">-</p>
                <p className="text-gray-400 text-xs mt-1 text-center">성과 리포트 제공</p>
                <p className="text-gray-400 text-sm mt-1">투명한 진행 현황</p>
              </div>
            </div>
          </div>

{/* 부즈앤버즈 성장 그래프 섹션 */}
      <section className="py-20 bg-gray-950 relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-blue-400 tracking-widest uppercase mb-3 block">Real Case Study</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">부즈앤버즈 실제 성과</h2>
            <p className="text-gray-400 text-sm">서비스 시작 1/19 ~ 현재 · 스마트스토어 월 매출 기준</p>
          </div>

          {/* 라인 그래프 SVG */}
          <div className="bg-white/5 rounded-2xl p-6 mb-6">
            <svg viewBox="0 0 600 300" className="w-full" xmlns="http://www.w3.org/2000/svg">
              {/* 그라데이션 정의 */}
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                </linearGradient>
              </defs>

              {/* 그리드 라인 (X축만) */}
              <line x1="60" y1="250" x2="560" y2="250" stroke="#333" strokeWidth="1"/>
              <line x1="60" y1="190" x2="560" y2="190" stroke="#222" strokeWidth="0.5" strokeDasharray="4"/>
              <line x1="60" y1="130" x2="560" y2="130" stroke="#222" strokeWidth="0.5" strokeDasharray="4"/>
              <line x1="60" y1="70" x2="560" y2="70" stroke="#222" strokeWidth="0.5" strokeDasharray="4"/>

              {/* 채움 영역 - 4월을 y=30으로 과장 */}
              <polygon
                points="100,210 230,180 360,140 490,30 490,250 100,250"
                fill="url(#lineGrad)"
              />

              {/* 메인 라인 */}
              <polyline
                points="100,210 230,180 360,140 490,30"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 데이터 포인트 */}
              <circle cx="100" cy="210" r="6" fill="#6366f1" stroke="#fff" strokeWidth="2"/>
              <circle cx="230" cy="180" r="6" fill="#6366f1" stroke="#fff" strokeWidth="2"/>
              <circle cx="360" cy="140" r="6" fill="#6366f1" stroke="#fff" strokeWidth="2"/>
              <circle cx="490" cy="30" r="7" fill="#60a5fa" stroke="#fff" strokeWidth="2.5"/>

              {/* 데이터 라벨 - 매출 (짤리지 않게 위치 조정) */}
              <text x="100" y="198" fill="#a5b4fc" fontSize="11" textAnchor="middle" fontWeight="bold">250만</text>
              <text x="230" y="168" fill="#a5b4fc" fontSize="11" textAnchor="middle" fontWeight="bold">497만</text>
              <text x="360" y="128" fill="#a5b4fc" fontSize="11" textAnchor="middle" fontWeight="bold">720만</text>
              <text x="490" y="22" fill="#60a5fa" fontSize="13" textAnchor="middle" fontWeight="bold">1,074만</text>

              {/* X축 라벨 - 월 */}
              <text x="100" y="268" fill="#666" fontSize="11" textAnchor="middle">1월</text>
              <text x="230" y="268" fill="#666" fontSize="11" textAnchor="middle">2월</text>
              <text x="360" y="268" fill="#666" fontSize="11" textAnchor="middle">3월</text>
              <text x="490" y="268" fill="#60a5fa" fontSize="11" textAnchor="middle" fontWeight="bold">4월 ★</text>
            </svg>
          </div>

          {/* 성과 수치 2개 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-blue-400">4.3배</p>
              <p className="text-gray-400 text-xs mt-1">1월 → 4월 매출 성장</p>
              <p className="text-gray-500 text-xs">250만 → 1,074만원</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-purple-400">+380%</p>
              <p className="text-gray-400 text-xs mt-1">전년 동기 대비</p>
              <p className="text-gray-500 text-xs">2025년 1~4월 vs 2026년</p>
            </div>
          </div>
        </div>
      </section>

      
      {/* 서비스 흐름 */}
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black text-white mb-4">어떻게 진행되냐구요?</h3>
            <p className="text-gray-400">복잡한 거 없어요. 신청하면 알아서 다 해드립니다.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { step: '01', icon: '📋', title: '캠페인 요청', desc: '제품 정보와 예산을 입력해주세요' },
              { step: '02', icon: '🤝', title: '인플루언서 매칭', desc: '브랜드에 맞는 인플루언서를 선정합니다' },
              { step: '03', icon: '📦', title: '제품 발송', desc: '선정된 인플루언서에게 제품을 발송합니다' },
              { step: '04', icon: '🎬', title: '콘텐츠 확인', desc: '제작된 콘텐츠를 검수합니다' },
              { step: '05', icon: '📱', title: '메타 광고 집행', desc: '검증된 콘텐츠로 광고를 집행합니다' },
              { step: '06', icon: '📊', title: '성과 리포트', desc: '광고 성과와 시딩 결과를 한눈에 확인' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center hover:bg-white/10 hover:border-blue-500/30 transition h-full">
                  <p className="text-blue-400 text-xs font-black mb-2 tracking-widest">STEP {item.step}</p>
                  <p className="text-3xl mb-3">{item.icon}</p>
                  <p className="text-white font-bold text-sm mb-2">{item.title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
                {i < 5 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-blue-500/50 text-lg z-10">→</div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16 flex flex-col md:flex-row justify-center items-center gap-4">
            <a href="#apply" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition w-full md:w-auto text-center">
              무료 상담 신청하기
            </a>
            <a href="/login" className="bg-white/10 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition border border-white/20 w-full md:w-auto text-center">
              시딩 플랫폼 시작하기
            </a>
          </div>
        </div>
      </section>

      {/* 053 장점 섹션 */}
      <section className="py-20 bg-black relative">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-purple-400 tracking-widest uppercase mb-3 block">Why 053</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">다른 대행사와 다른 점</h2>
            <p className="text-gray-400 text-sm">소상공인·첫 마케팅 대표님을 위한 실속 전략</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition">
              <p className="text-2xl mb-3">🎬</p>
              <p className="font-bold text-white mb-2">경력 9년차 PD 직접 QC</p>
              <p className="text-gray-400 text-sm">모든 콘텐츠는 경력 9년차 PD가 직접 품질 검수합니다. 브랜드 이미지를 지키는 콘텐츠만 통과됩니다.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition">
              <p className="text-2xl mb-3">💡</p>
              <p className="font-bold text-white mb-2">나노·마이크로 인플루언서 전략</p>
              <p className="text-gray-400 text-sm">메가 인플루언서 1건(100만~5천만원) 대신, 실구매자처럼 보이는 나노·마이크로 인플루언서로 생생한 후기를 값싸게 확보합니다.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition">
              <p className="text-2xl mb-3">🔄</p>
              <p className="font-bold text-white mb-2">매번 새로운 인플루언서 공급</p>
              <p className="text-gray-400 text-sm">고정 풀이 아닌 매 캠페인마다 새로운 인플루언서를 직접 발굴·섭외합니다. 항상 신선한 콘텐츠와 새로운 오디언스에게 도달합니다.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition">
              <p className="text-2xl mb-3">⚡</p>
              <p className="font-bold text-white mb-2">전략에만 집중하세요</p>
              <p className="text-gray-400 text-sm">인플루언서 리스트업·섭외·확인은 직원 1인분의 업무입니다. 그 모든 과정을 053이 대신하고, 대표님은 사업 전략에만 집중할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="apply" className="py-48 bg-black relative">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-8 tracking-tight">함께 성장하시겠습니까?</h2>
            <p className="text-blue-400 text-xl font-bold">3시간 이내로 연락드립니다.</p>
          </div>
          <form id="leadForm" className="space-y-6 bg-[#0d0d0d] border border-white/5 p-10 md:p-16 rounded-[48px]">
            <div className="grid md:grid-cols-2 gap-6">
              <input type="text" id="managerName" required placeholder="담당자 이름" className="input-dark w-full rounded-2xl p-5 text-white" />
              <input type="text" id="jobTitle" required placeholder="직함 / 직위 (예: 마케팅 팀장)" className="input-dark w-full rounded-2xl p-5 text-white" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <input type="tel" id="phoneNumber" required placeholder="전화번호 (예: 010-1234-5678)" className="input-dark w-full rounded-2xl p-5 text-white" />
              <input type="url" id="snsUrl" placeholder="SNS URL (예: instagram.com/...)" className="input-dark w-full rounded-2xl p-5 text-white" />
            </div>
            <input type="url" id="websiteUrl" placeholder="홈페이지 URL (예: https://...)" className="input-dark w-full rounded-2xl p-5 text-white" />
            <textarea id="inquiryMessage" required placeholder="어떤 점 때문에 문의 주셨나요? 자유롭게 기재해 주세요 😊" rows="5" className="input-dark w-full rounded-2xl p-5 text-white resize-none" />
            <button type="submit" id="submitBtn" className="w-full bg-blue-600 text-white py-8 rounded-[32px] font-black text-2xl hover:bg-blue-700 transition-all">신청하기 →</button>
          </form>
          <div id="successMsg" className="hidden text-center p-20 bg-blue-600/10 rounded-[48px] border border-blue-500/20">
            <h3 className="text-3xl font-black mb-4 text-blue-500">신청 완료!</h3>
            <p>전문가가 곧 연락드리겠습니다.</p>
          </div>
        </div>
      </section>
    </>
  )
}
