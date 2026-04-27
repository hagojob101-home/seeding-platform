import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { brand_name, industry, store_url, channels } = req.body
  
  const { error } = await supabase.from('consultations').insert({
    brand_name,
    industry,
    store_url,
    channels,
  })
  
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ success: true })
}
