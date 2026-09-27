import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function Submit() {
  const router = useRouter()
  const { participation_id } = router.query
  const [name, setName] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [cleanFile, setCleanFile] = useState(null)
  const [finalFile, setFinalFile] = useState(null)
  const [contractFile, setContractFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [participation, setParticipation] = useState(null)

  useEffect(() => {
    if (!participation_id) return
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/influencer/login'); return }
      const { data } = await supabase.from('participations').select('*, campaigns(name), users!participations_influencer_id_fkey(name)').eq('id', participation_id).single()
      setParticipation(data)
      setName(data?.users?.name || '')
    }
    init()
  }, [participation_id])

  const uploadFile = async (file, folder) => {
    if (!file) return null
    const ext = file.name.split('.').pop()
    const { data: { user } } = await supabase.auth.getUser()
    const filename = user.id + '/' + folder + '/' + Date.now() + '.' + ext
    const { error } = await supabase.storage.from('influencer-files').upload(filename, file)
    if (error) throw error
    return filename
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const cleanUrl = await uploadFile(cleanFile, 'clean')
      const finalUrl = await uploadFile(finalFile, 'final')
      const contractUrl = await uploadFile(contractFile, 'contracts')

      const submitData = {
        name,
        upload_url: uploadUrl,
        clean_file_url: cleanUrl,
        final_file_url: finalUrl,
        signed_contract_url: contractUrl,
        submitted_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('participations').update({
        status: '콘텐츠확인',
        submit_data: submitData,
        upload_link: uploadUrl,
      }).eq('id', participation_id)

      if (error) throw error
      alert('콘텐츠가 제출되었습니다! 관리자 확인 후 처리됩니다.')
      router.push('/influencer/dashboard')
    } catch (err) {
      alert('오류: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-highlight ">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-ink">콘텐츠 제출</h1>
        <button onClick={() => router.push('/influencer/dashboard')} className="text-sm text-muted hover:text-ink">← 대시보드</button>
      </nav>
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-8">
          {participation && (
            <div className="mb-6 bg-highlight rounded-xl p-4">
              <p className="text-sm text-muted">캠페인</p>
              <p className="font-bold text-ink">{participation.campaigns?.name}</p>
            </div>
          )}
          <div className="mb-6 bg-highlight border border-line rounded-xl p-4">
            <p className="text-sm font-bold text-ink mb-2">파일명 규칙</p>
            <p className="text-sm text-ink">클린본: <span className="font-mono font-bold">클린본_이름</span></p>
            <p className="text-sm text-ink">최종본: <span className="font-mono font-bold">최종본_이름</span></p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">이름</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ink" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">클린본 파일 업로드</label>
              <input type="file" onChange={e => setCleanFile(e.target.files[0])} className="w-full border rounded-xl px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">최종본 파일 업로드</label>
              <input type="file" onChange={e => setFinalFile(e.target.files[0])} className="w-full border rounded-xl px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">업로드 URL <span className="text-muted text-xs">(업로드 전이면 계정 URL)</span></label>
              <input value={uploadUrl} onChange={e => setUploadUrl(e.target.value)} placeholder="https://www.instagram.com/..." className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ink" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">서명된 계약서 업로드</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setContractFile(e.target.files[0])} className="w-full border rounded-xl px-4 py-3" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-ink text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50">
              {loading ? '제출 중...' : '콘텐츠 제출하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
