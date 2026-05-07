export interface Diagnosis {
  id: string
  lead_id: string
  summary: string
  hero_angle: string
  tone: string
  gap_score: number
  suggested_message: string
  raw_claude_json: unknown | null
  created_at: string
}

export interface DiagnosisInput {
  lead_id: string
  business_name: string
  niche: string
  city: string
  has_website: boolean
  website_url: string | null
  google_rating: number | null
  review_count: number | null
}
