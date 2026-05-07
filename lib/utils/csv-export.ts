import type { Lead } from '@/types/lead'

export function leadsToCSV(leads: Lead[]): string {
  const headers = [
    'ID', 'Business Name', 'City', 'Niche', 'Address',
    'Phone', 'Email', 'Has Website', 'Website URL',
    'Google Rating', 'Reviews', 'Years on Map',
    'Status', 'Gap Score', 'Created At'
  ]

  const rows = leads.map(l => [
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
    l.created_at,
  ])

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
