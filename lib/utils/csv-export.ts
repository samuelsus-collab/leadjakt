import type { Lead } from '@/types/lead'

interface DiagnosisRow {
  summary: string | null
  hero_angle: string | null
  gap_score: number | null
  suggested_message: string | null
}

interface LeadWithDiagnosis extends Lead {
  diagnoses?: DiagnosisRow[]
}

export function leadsToCSV(leads: LeadWithDiagnosis[]): string {
  const headers = [
    'ID', 'Business Name', 'City', 'Niche', 'Address',
    'Phone', 'Email', 'Has Website', 'Website URL',
    'Google Rating', 'Reviews', 'Years on Map',
    'Status', 'Gap Score',
    'Diagnosis Summary', 'Hero Angle', 'Suggested Message',
    'Notes', 'Created At',
  ]

  const rows = leads.map(l => {
    const d = l.diagnoses?.[0]
    return [
      l.id,
      l.business_name,
      l.city,
      l.niche,
      l.address ?? '',
      l.phone ?? '',
      l.email ?? '',
      l.has_website ? 'Yes' : 'No',
      l.website_url ?? '',
      l.google_rating ?? '',
      l.review_count ?? '',
      l.years_on_map ?? '',
      l.status,
      l.gap_score ?? '',
      d?.summary ?? '',
      d?.hero_angle ?? '',
      d?.suggested_message ?? '',
      l.notes ?? '',
      l.created_at,
    ]
  })

  const escape = (v: string | number) => {
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  return [headers, ...rows]
    .map(row => row.map(escape).join(','))
    .join('\n')
}
