export type LeadStatus =
  | 'new'
  | 'diagnosed'
  | 'outreach_ready'
  | 'sent'
  | 'replied'
  | 'booked'

export type OutreachChannel = 'email' | 'sms' | 'instagram_dm' | 'linkedin'

export interface Lead {
  id: string
  user_id: string
  business_name: string
  address: string | null
  city: string
  niche: string
  phone: string | null
  email: string | null
  website_url: string | null
  google_rating: number | null
  review_count: number | null
  years_on_map: number | null
  has_website: boolean
  website_age: number | null
  status: LeadStatus
  gap_score: number | null
  scout_query: string | null
  source_url: string | null
  created_at: string
  updated_at: string
}

export interface ScoutResult {
  business_name: string
  address: string
  city: string
  phone: string | null
  google_rating: number | null
  review_count: number | null
  years_on_map: number | null
  has_website: boolean
  website_url: string | null
  website_age: number | null
  source_url: string | null
}

export interface PipelineMetrics {
  total: number
  no_website: number
  reply_rate: number
  booked: number
}
