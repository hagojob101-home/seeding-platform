import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { participation_id } = req.body

  try {
    // 참여 정보 가져오기
    const { data: participation, error } = await supabase
      .from('participations')
      .select('*, campaigns(*), users(*)')
      .eq('id', participation_id)
      .single()

    if (error || !participation) return res.status(404).json({ error: '참여 정보를 찾을 수 없습니다.' })

    const apply = participation.apply_data || {}
    const campaign = participation.campaigns || {}
    const user = participation.users || {}

    const name = apply.name || user.name || ''
    const address = apply.address || ''
    const phone = apply.phone || ''
    const bank_name = apply.bank_name || ''
    const bank_account = apply.bank_account || ''
    const resident_number = apply.resident_number || ''
    const reward = campaign.reward || '200,000'

    const today = new Date()
    const startDate = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`
    const endDateObj = new Date(today)
    endDateObj.setFullYear(endDateObj.getFullYear() + 1)
    const endDate = `${endDateObj.getFullYear()}년 ${endDateObj.getMonth()+1}월 ${endDateObj.getDate()}일`

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const addPage = () => {
      const page = pdfDoc.addPage([595, 842])
      return page
    }

    const drawText = (page, text, x, y, size = 10, bold = false) => {
      page.drawText(text, {
        x, y,
        size,
        font: bold ? boldFont : font,
        color: rgb(0, 0, 0),
      })
    }

    const drawLine = (page, x1, y1, x2, y2) => {
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      })
    }

    // Page 1
    const page1 = addPage()
    let y = 780

    drawText(page1, '프리랜서 인플루언서와 기업간 업무계약서', 100, y, 14, true)
    y -= 40

    drawText(page1, '농업회사법인 부즈앤버즈 미더리 주식회사 (이하 "갑")과', 50, y, 10)
    y -= 18
    drawText(page1, `${name} (이하 "을")은 바이럴 광고 촬영 업무를 수행함에 있어`, 50, y, 10)
    y -= 18
    drawText(page1, '다음과 같이 프리랜서 계약을 체결한다.', 50, y, 10)
    y -= 35

    drawText(page1, '제 1조 (목적)', 50, y, 11, true)
    y -= 20
    drawText(page1, '"갑"이 "을"에게 의뢰한 영상 촬영을 효과적으로 작업하기 위한 범위와 규정을 목적으로 한다.', 50, y, 10)
    y -= 35

    drawText(page1, '제 2조 (일반사항)', 50, y, 11, true)
    y -= 20
    drawText(page1, '- 작업형식 : SNS 바이럴 광고 촬영', 60, y, 10)
    y -= 18
    drawText(page1, "- 주 업무: '갑'이 제공하는 제품의 광고 촬영", 60, y, 10)
    y -= 18
    drawText(page1, '- 작업물 형태: 광고 촬영본 제공 (최종본, 클린본)', 60, y, 10)
    y -= 35

    drawText(page1, '제 3조 (범위)', 50, y, 11, true)
    y -= 20
    drawText(page1, '"을"은 "갑"의 작업 범위에 대해 다음의 내용을 수행한다.', 50, y, 10)
    y -= 18
    drawText(page1, '- 촬영 기획 가이드라인에 맞춰 촬영 (미제공 시 자유롭게 제작)', 60, y, 10)
    y -= 18
    drawText(page1, '- 제작 영상의 클린본 제공(자막, 음악 제거한 컷 편집본)', 60, y, 10)
    y -= 35

    drawText(page1, '제 4조 (계약기간)', 50, y, 11, true)
    y -= 20
    drawText(page1, `본 계약은 ${startDate}부터 ${endDate}까지로 한다.`, 50, y, 10)
    y -= 18
    drawText(page1, "'을'의 작업물 지적재산권 및 저작권의 활용기간은 최종 납품일로부터 365일로 한다.", 50, y, 10)
    y -= 35

    drawText(page1, '제 5조 (보수)', 50, y, 11, true)
    y -= 20
    drawText(page1, `"을"의 보수는 촬영일 이후 3일이내 지급하며 비용은 ${reward}으로 책정한다.`, 50, y, 10)
    y -= 18
    drawText(page1, "'갑'은 '을'에게 제5조 1항에 책정된 금액에서 프리랜서 사업소득세 3.3%를 공제한 후 보수를 지급한다.", 50, y, 10)
    y -= 25
    drawText(page1, '- 입금 계좌 정보', 60, y, 10)
    y -= 18
    drawText(page1, `- 은  행  명 : ${bank_name}`, 70, y, 10)
    y -= 18
    drawText(page1, `- 계좌번호 : ${bank_account}`, 70, y, 10)
    y -= 18
    drawText(page1, `- 예  금  주 : ${name}`, 70, y, 10)
    y -= 35

    drawText(page1, '제 6조 (작업내용)', 50, y, 11, true)
    y -= 20
    drawText(page1, '- "을"은 "갑"이 요구하는 성격의 업무를 성실히 이행하기로 한다.', 60, y, 10)
    y -= 18
    drawText(page1, '- 본 계약에 의하여 "을"이 납품한 결과물의 소유권은 "갑"에게 있으며,', 60, y, 10)
    y -= 15
    drawText(page1, '  "을"은 상업적 용도로 활용할 수 없다.', 60, y, 10)
    y -= 18
    drawText(page1, '- "을"은 본 계약에 의해 작성한 결과물의 저작권에 대해 책임을 보증한다.', 60, y, 10)
    y -= 18
    drawText(page1, '- "을"은 계약기간 중에 취득한 "갑"의 업무내용에 대해 비밀을 유지한다.', 60, y, 10)
    y -= 18
    drawText(page1, '- "을"은 촬영 내용, 기획안 등의 비밀을 유지한다.', 60, y, 10)
    y -= 35

    drawText(page1, '제 7조 (비밀 유지)', 50, y, 11, true)
    y -= 20
    drawText(page1, '"을"은 본 작업과 관련된 일체의 정보를 외부에 누설하거나 유출해서는 안되며', 50, y, 10)
    y -= 15
    drawText(page1, '이로 인해 발생하는 모든 책임을 "을"이 진다.', 50, y, 10)

    // Page 2
    const page2 = addPage()
    y = 780

    drawText(page2, '제 8조 (개인정보의 보호 등)', 50, y, 11, true)
    y -= 20
    drawText(page2, '- 모델은 업무과정에서 회사가 시행 중인 개인정보 보호정책 및 절차를 준수하여야 한다.', 60, y, 10)
    y -= 18
    drawText(page2, '- 모델은 회사가 본 계약의 체결 및 이행을 위하여 개인정보보호법 및 회사의', 60, y, 10)
    y -= 15
    drawText(page2, '  개인정보 취급방침에 따라 자신의 개인정보를 수집, 저장, 접근, 보급, 사용할 수 있으며,', 60, y, 10)
    y -= 15
    drawText(page2, '  본 계약서에 서명하는 것은 자신의 개인정보의 처리에 대한 동의를 구성한다는 점을', 60, y, 10)
    y -= 15
    drawText(page2, '  충분히 인지하고 있다.', 60, y, 10)
    y -= 35

    drawText(page2, '제 9조 (계약의 해지)', 50, y, 11, true)
    y -= 20
    drawText(page2, '- 회사는 모델에게 다음 각 호의 사유가 발생한 경우, 모델에 대한 최고없이', 60, y, 10)
    y -= 15
    drawText(page2, '  본 계약을 즉시 해지할 수 있다.', 60, y, 10)
    y -= 18
    drawText(page2, '1) 본 계약을 위반한 경우', 70, y, 10)
    y -= 15
    drawText(page2, '2) 고의 또는 과실로 회사에 손해를 발생하게 한 경우', 70, y, 10)
    y -= 15
    drawText(page2, '3) 신체적, 정신적 장애로 위임업무 수행이 어려운 경우', 70, y, 10)
    y -= 15
    drawText(page2, '4) 모델의 업무수행실적이 현저하게 저조하다고 회사가 판단한 경우', 70, y, 10)
    y -= 15
    drawText(page2, '5) 기타 회사가 모델과의 본 계약 관계를 유지할 수 없다고 인정되는 사유가 있는 경우', 70, y, 10)
    y -= 20
    drawText(page2, '- 제1항의 각 호의 사유가 발생하지 않는 경우에도, 회사는 모델에 대한 [7]일 전', 60, y, 10)
    y -= 15
    drawText(page2, '  통지로서 본 계약을 해지할 수 있고, 회사는 모델에 대하여 해지에 따른', 60, y, 10)
    y -= 15
    drawText(page2, '  손해배상의무를 부담하지 아니한다.', 60, y, 10)
    y -= 18
    drawText(page2, '- 모델은 본 계약기간 중에는 본 계약을 해지할 수 없으며, 부득이한 사유로 해지하고자', 60, y, 10)
    y -= 15
    drawText(page2, '  하는 경우 1개월 전에 회사에 서면 통지를 한 후 승인을 받아야 한다.', 60, y, 10)
    y -= 18
    drawText(page2, '- 모델은 본 계약이 해지되는 경우 회사의 요구에 따라 인수인계 등 본 계약의', 60, y, 10)
    y -= 15
    drawText(page2, '  해지와 관련된 절차에 성실하게 협조하여야 한다.', 60, y, 10)
    y -= 40

    drawText(page2, '위와 같이 계약을 체결하고 계약서 2통을 작성, 서명 날인 후 "갑"과 "을"이 각각 1통씩 보관한다.', 50, y, 10)
    y -= 40

    drawText(page2, `계  약  일  자 : ${startDate}`, 50, y, 10)
    y -= 50

    drawText(page2, '(갑)', 50, y, 11, true)
    y -= 20
    drawText(page2, '주       소 : 경기도 용인시 처인구 모현읍 초부로 148번길 23-42 다동', 60, y, 10)
    y -= 18
    drawText(page2, '사업자등록번호 : 644-88-02524', 60, y, 10)
    y -= 18
    drawText(page2, '회   사   명 : 주식회사 농업회사법인 부즈앤버즈 미더리 (주)', 60, y, 10)
    y -= 18
    drawText(page2, '대   표   자 : 유 관 석    (인)', 60, y, 10)
    y -= 50

    drawText(page2, '(을)', 50, y, 11, true)
    y -= 20
    drawText(page2, `주       소 : ${address}`, 60, y, 10)
    y -= 18
    drawText(page2, `주민등록번호 : ${resident_number}`, 60, y, 10)
    y -= 18
    drawText(page2, `성       명 : ${name}`, 60, y, 10)
    y -= 18
    drawText(page2, `연  락  처 : ${phone}`, 60, y, 10)
    y -= 40

    drawLine(page2, 50, y, 280, y)
    y -= 15
    drawText(page2, '서명 (을):', 50, y, 10)

    const pdfBytes = await pdfDoc.save()
    const buffer = Buffer.from(pdfBytes)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="contract_${name}.pdf"`)
    res.send(buffer)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
