import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

export default function Submit() {
  const router = useRouter()
  const { participation_id } = router.query
  const [loading, setLoading] = useState(false)
  const [participation, setParticipation] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    upload_url: '',
  })
  const [cleanFile, setCleanFile] = useState(null)
  const [finalFile, setFinalFile] = useState(null)
  const [contractFile, setContractFile] = useState(null)

  useEffect(() => {
    if (!participation_id) return
    const fetch = async () => {
      const { data } = await supabase
        .from('participations')
        .select('*, campaigns(*)')
        .eq('id', participation_id)
        .single()
      setParticipation(data)
      if (data?.apply_data?.name) {
        setForm(f => ({ ...f, name: data.apply_data.name }))
      }
    }
    fetch()
  }, [participation_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/influencer/login'); return }

      let clean_file_url = ''
      let final_file_url = ''
      let contract_file_url = ''

      if (cleanFile) {
        const { data, error: upErr } = await supabase.storage
          .from('documents')
          .upload(user.id + '/clean_' + Date.now(), cleanFile)
        if (upErr) throw upErr
        clean_file_url = data.path
      }

      if (finalFile) {
        const { data, error: upErr } = await supabase.storage
          .from('documents')
          .upload(user.id + '/final_' + Date.now(), finalFile)
        if (upErr) throw upErr
        final_file_url = data.path
      }

      if (contractFile) {
        const { data, error: upErr } = await supabase.storage
          .from('documents')
          .upload(user.id + '/contract_' + Date.now(), contractFile)
        if (upErr) throw upErr
        contract_file_url = data.path
      }

      const { error: updateError } = await supabase
        .from('participations')
        .update({
          status: '콘텐츠확인',
          submit_data: {
            name: form.name,
            upload_url: form.upload_url,
            clean_file_url,
            final_file_url,
            contract_file_url,
            submitted_at: new Date().toISOString(),
          }
        })
        .eq('id', participation_id)

      if (updateError) throw updateError

      alert('콘텐츠가 제출되었습니다!')
      router.push('/influencer/dashboard')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (!participation) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-purple-700 mb-2">콘텐츠 제출</h1>
          <p className="text-gray-500 text-sm">{participation.campaigns?.name}</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 mb-6 text-sm text-purple-700">
          <p className="font-semibold mb-1">📌 파일명 규칙</p>
          <p>클린본_이름 / 최종본_이름</p>
          <p className="text-xs text-gray-500 mt-1">예시: 클린본_홍길동, 최종본_홍길동</p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-xl">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">이름 *</label>
            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="실명 입력"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">클린본 파일 업로드 *</label>
            <p className="text-xs text-gray-400 mb-2">파일명: 클린본_{form.name || '이름'}</p>
            <input
              type="file"
              accept="video/*,image/*,.zip"
              className="w-full border rounded-xl px-4 py-3"
              onChange={e => setCleanFile(e.target.files[0])}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">최종본 파일 업로드 *</label>
            <p className="text-xs text-gray-400 mb-2">파일명: 최종본_{form.name || '이름'}</p>
            <input
              type="file"
              accept="video/*,image/*,.zip"
              className="w-full border rounded-xl px-4 py-3"
              onChange={e => setFinalFile(e.target.files[0])}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">업로드 URL *</label>
            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="업로드 완료 URL 또는 계정 URL"
              value={form.upload_url}
              onChange={e => setForm({...form, upload_url: e.target.value})}
              required
            />
            <p className="text-xs text-gray-400 mt-1">업로드 전이라면 계정 URL을 입력해주세요</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">서명한 계약서 업로드 *</label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full border rounded-xl px-4 py-3"
              onChange={e => setContractFile(e.target.files[0])}
              required
            />
            <p className="text-xs text-gray-400 mt-1">다운로드한 계약서에 서명 후 업로드해주세요</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition mt-2"
          >
            {loading ? '제출 중...' : '제출하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
