import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runDiagnoserAgent } from '@/lib/anthropic/diagnoser-agent'

export const maxDuration = 30

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id } = await request.json() as { lead_id: string }

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', lead_id)
    .eq('user_id', user.id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  try {
    const diagnosisData = await runDiagnoserAgent({
      lead_id,
      business_name: lead.business_name,
      niche: lead.niche,
      city: lead.city,
      has_website: lead.has_website,
      website_url: lead.website_url,
      google_rating: lead.google_rating,
      review_count: lead.review_count,
    })

    const { data: diagnosis, error: diagError } = await supabase
      .from('diagnoses')
      .insert({ lead_id, ...diagnosisData })
      .select()
      .single()

    if (diagError) return NextResponse.json({ error: diagError.message }, { status: 500 })

    const { data: updatedLead } = await supabase
      .from('leads')
      .update({ status: 'diagnosed', gap_score: diagnosisData.gap_score })
      .eq('id', lead_id)
      .select()
      .single()

    return NextResponse.json({ diagnosis, lead: updatedLead })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Diagnosis failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
