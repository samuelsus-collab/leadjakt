import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Lead, ScoutResult } from '@/types/lead'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const niche = searchParams.get('niche')
  const has_website = searchParams.get('has_website')
  const city = searchParams.get('city')
  const limit = parseInt(searchParams.get('limit') ?? '100')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (niche) query = query.eq('niche', niche)
  if (has_website !== null) query = query.eq('has_website', has_website === 'true')
  if (city) query = query.eq('city', city)

  const { data: leads, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute metrics
  const { data: allLeads } = await supabase
    .from('leads')
    .select('status, has_website')
    .eq('user_id', user.id)

  const totalLeads = allLeads ?? []
  const noWebsite = totalLeads.filter(l => !l.has_website).length
  const sent = totalLeads.filter(l => ['sent', 'replied', 'booked'].includes(l.status)).length
  const replied = totalLeads.filter(l => ['replied', 'booked'].includes(l.status)).length
  const booked = totalLeads.filter(l => l.status === 'booked').length
  const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0

  return NextResponse.json({
    leads: leads as Lead[],
    total: count ?? 0,
    metrics: {
      total: totalLeads.length,
      no_website: noWebsite,
      reply_rate: replyRate,
      booked,
    },
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leads, niche, city } = await request.json() as {
    leads: ScoutResult[]
    niche: string
    city: string
  }

  const names = leads.map(l => l.business_name)
  const { data: existing } = await supabase
    .from('leads')
    .select('business_name, city')
    .eq('user_id', user.id)
    .in('business_name', names)

  const existingKeys = new Set(
    (existing ?? []).map(e => `${e.business_name.toLowerCase()}|${e.city.toLowerCase()}`)
  )

  const rows = leads
    .filter(l => !existingKeys.has(`${l.business_name.toLowerCase()}|${(l.city || city).toLowerCase()}`))
    .map(l => ({
      user_id: user.id,
      business_name: l.business_name,
      address: l.address,
      city: l.city || city,
      niche,
      phone: l.phone,
      website_url: l.website_url,
      google_rating: l.google_rating,
      review_count: l.review_count,
      years_on_map: l.years_on_map,
      has_website: l.has_website,
      website_age: l.website_age,
      source_url: l.source_url,
      scout_query: `${niche} in ${city}`,
      status: 'new',
    }))

  if (!rows.length) {
    return NextResponse.json({ leads: [], skipped: leads.length }, { status: 200 })
  }

  const { data, error } = await supabase.from('leads').insert(rows).select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ leads: data, skipped: leads.length - rows.length }, { status: 201 })
}
