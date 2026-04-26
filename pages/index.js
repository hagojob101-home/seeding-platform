import Head from 'next/head'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    const chips = document.querySelectorAll('.channel-chip')
    const selected = new Set()
    chips.forEach(c => c.addEventListener('click', () => {
      const v = c.dataset.value
      if (selected.has(v)) { selected.delete(v); c.classList.remove('active') }
      else { selected.add(v); c.classList.add('active') }
    }))

    const form = document.getElementById('leadForm')
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        form.classList.add('hidden')
        document.getElementById('successMsg').classList.remove('hidden')
        alert('정상적으로 접수되었습니다.')
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
          <a href="#apply" className="bg-blue-600 text-white px-8 py-3 rounded-full text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">컨설팅 신청</a>
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
            <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black leading-[1.2] mb-10 tracking-tight">
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

      <section id="apply" className="py-48 bg-black relative">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-8 tracking-tight">함께 성장하시겠습니까?</h2>
            <p className="text-blue-400 text-xl font-bold">12시간 이내로 연락드립니다.</p>
          </div>
          <form id="leadForm" className="space-y-8 bg-[#0d0d0d] border border-white/5 p-10 md:p-20 rounded-[48px]">
            <div className="grid md:grid-cols-2 gap-8">
              <input type="text" id="brandName" required placeholder="브랜드명" className="input-dark w-full rounded-2xl p-5 text-white" />
              <input type="text" id="industry" required placeholder="산업 분야" className="input-dark w-full rounded-2xl p-5 text-white" />
            </div>
            <input type="url" id="storeUrl" required placeholder="자사몰 URL (https://...)" className="input-dark w-full rounded-2xl p-5 text-white" />
            <div className="flex flex-wrap gap-3">
              <div className="channel-chip px-6 py-3 rounded-xl text-sm font-bold" data-value="인스타그램">인스타그램</div>
              <div className="channel-chip px-6 py-3 rounded-xl text-sm font-bold" data-value="페이스북">페이스북</div>
              <div className="channel-chip px-6 py-3 rounded-xl text-sm font-bold" data-value="유튜브">유튜브</div>
            </div>
            <button type="submit" id="submitBtn" className="w-full bg-blue-600 text-white py-8 rounded-[32px] font-black text-2xl hover:bg-blue-700 transition-all">신청하기</button>
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
