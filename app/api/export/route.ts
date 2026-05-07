import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { leadsToCSV } from '@/lib/utils/csv-export'
import type { Lead } from '@/types/lead'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: leads, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const csv = leadsToCSV((leads ?? []) as Lead[])

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leadjakt-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
