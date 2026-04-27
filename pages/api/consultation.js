import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { manager_name, job_title, phone_number, sns_url, website_url, inquiry_message } = req.body
  
  const { error } = await supabase.from('consultations').insert({
    manager_name,
    job_title,
    phone_number,
    sns_url,
    website_url,
    inquiry_message,
  })
  
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ success: true })
}
