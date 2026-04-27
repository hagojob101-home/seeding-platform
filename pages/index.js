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
            <a href="#apply" className="bg-blue-600 text-white px-8 py-3 rounded-full text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">컨설팅 신청</a>
          </div>
        </div>
      </nav>

      <section className="relative h-screen flex items-center pt-20">
        <div className="absolute inset-0 z-0" dangerouslySetInnerHTML={{__html: `
          <script type="module" src="https://unpkg.com/@splinetool/viewer@1.0.93/build/spline-viewer.js"></script>
          <spline-viewer url="https://prod.spline.design/YvZ1-d16xfXxsqph/scene.splinecode"></spline-viewer>
        `}} />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10 pointer-events-none"></div>
        <div className="relative z-20 max-w-7xl mx-auto px-8 w-full">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black leading-[1.6] mb-10 tracking-tight">
              성장이 멈춘<br/>브랜드를 위한<br/><span className="text-blue-500">확실한 해답</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-14 leading-[1.8] max-w-2xl font-medium">
              단순 집행은 누구나 합니다. 053은 지표로 증명합니다.<br/>
              ROAS 800% 이상의 실제 사례가 보여주는 압도적 차이.
            </p>
            <a href="#apply" className="bg-white text-black px-12 py-6 rounded-2xl font-black text-xl hover:scale-105 transition-all inline-block">무료 성과 진단</a>
          </div>
        </div>
      </section>

      {/* 서비스 소개 섹션 */}
      <section className="py-32 bg-[#080808] relative">
        <div className="max-w-7xl mx-auto px-8">

          {/* 타겟 공감 헤드라인 */}
          <div className="text-center mb-20">
            <p className="text-blue-400 font-bold text-lg mb-4 tracking-widest uppercase">For Small Business</p>
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[2.0]">
              메타 광고, 들어는 봤는데<br/>
              <span className="text-gradient">전혀 감이 안 오시나요?</span>
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
              소상공인, 1인 기업, 상품 하나뿐인 브랜드,<br/>
              마케팅을 처음 시작하는 대표님을 위해 만들었습니다.<br/>
              <span className="text-white font-semibold">메타 광고 집행부터 인플루언서 관리까지, 한 번에.</span>
            </p>
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
            <h3 className="text-3xl font-black text-white mb-4">
              광고 집행 + 인플루언서 관리<br/>
              <span className="text-blue-400">한 플랫폼에서 한 번에</span>
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              따로따로 관리하느라 지치셨나요? 053에서는 메타 광고 성과와 인플루언서 시딩을 동시에 운영하고 한눈에 확인할 수 있습니다.
            </p>
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-3xl font-black text-blue-400">ROAS 800%+</p>
                <p className="text-gray-400 text-sm mt-1">메타 광고 실제 사례</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-black text-purple-400">3시간</p>
                <p className="text-gray-400 text-sm mt-1">이내 담당자 연락</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-black text-green-400">100%</p>
                <p className="text-gray-400 text-sm mt-1">투명한 진행 현황</p>
              </div>
            </div>
          </div>

          {/* 서비스 흐름 */}
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black text-white mb-4">이렇게 진행됩니다</h3>
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
          <div className="text-center mt-16">
            <a href="#apply" className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition inline-block mr-4">
              무료 상담 신청하기
            </a>
            <a href="/login" className="bg-white/10 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition inline-block border border-white/20">
              시딩 플랫폼 시작하기
            </a>
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
