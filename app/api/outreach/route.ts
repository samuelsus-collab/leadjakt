import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'
import { selectChannel } from '@/lib/utils/channel-selector'
import type { OutreachChannel } from '@/types/lead'

export const maxDuration = 30

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('outreach')
    .select('*, leads(business_name, city, niche)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ outreach: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, channel: requestedChannel } = await request.json() as {
    lead_id: string
    channel?: OutreachChannel
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('*, diagnoses(*)')
    .eq('id', lead_id)
    .eq('user_id', user.id)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const channel = requestedChannel ?? selectChannel(lead.niche)
  const diagnosis = lead.diagnoses?.[0]

  const prompt = `Write a personalized cold outreach message in Swedish for this business:

Business: ${lead.business_name}
Type: ${lead.niche}
City: ${lead.city}
Channel: ${channel} (${channel === 'sms' ? 'keep under 160 chars' : channel === 'instagram_dm' ? 'casual, under 200 chars' : 'professional, 100-150 words'})
${diagnosis ? `Hero angle: ${diagnosis.hero_angle}\nTone: ${diagnosis.tone}` : ''}
${lead.has_website ? `Website: ${lead.website_url ?? 'exists but outdated'}` : 'No website at all'}

Write ONLY the message body. No subject line. No explanation. In Swedish.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const body = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  const { data: outreach, error } = await supabase
    .from('outreach')
    .insert({
      lead_id,
      diagnosis_id: diagnosis?.id ?? null,
      channel,
      body,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from('leads')
    .update({ status: 'outreach_ready' })
    .eq('id', lead_id)

  return NextResponse.json({ outreach }, { status: 201 })
}
