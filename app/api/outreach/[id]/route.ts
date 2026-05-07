import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OutreachStatus } from '@/types/outreach'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status, notes } = await request.json() as { status: OutreachStatus; notes?: string }

  const timestamps: Record<string, string> = {}
  if (status === 'sent') timestamps.sent_at = new Date().toISOString()
  if (status === 'replied') timestamps.replied_at = new Date().toISOString()
  if (status === 'booked') timestamps.booked_at = new Date().toISOString()

  const { data: outreach, error } = await supabase
    .from('outreach')
    .update({ status, notes, ...timestamps })
    .eq('id', id)
    .select('*, leads(user_id)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Verify ownership via join
  if ((outreach as any).leads?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (status === 'booked') {
    await supabase
      .from('leads')
      .update({ status: 'booked' })
      .eq('id', outreach.lead_id)
  } else if (status === 'replied') {
    await supabase
      .from('leads')
      .update({ status: 'replied' })
      .eq('id', outreach.lead_id)
  } else if (status === 'sent') {
    await supabase
      .from('leads')
      .update({ status: 'sent' })
      .eq('id', outreach.lead_id)
  }

  return NextResponse.json({ outreach })
}
