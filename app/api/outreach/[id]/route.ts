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

  const body = await request.json() as { status?: OutreachStatus; notes?: string }
  const { status, notes } = body

  const timestamps: Record<string, string> = {}
  if (status === 'sent') timestamps.sent_at = new Date().toISOString()
  if (status === 'replied') timestamps.replied_at = new Date().toISOString()
  if (status === 'booked') timestamps.booked_at = new Date().toISOString()

  const updates: Record<string, unknown> = { ...timestamps }
  if (status !== undefined) updates.status = status
  if (notes !== undefined) updates.notes = notes

  const { data: outreach, error } = await supabase
    .from('outreach')
    .update(updates)
    .eq('id', id)
    .select('*, leads(user_id)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Verify ownership via join (Supabase types the joined relation loosely).
  const owner = (outreach as { leads: { user_id: string } | { user_id: string }[] | null }).leads
  const ownerId = Array.isArray(owner) ? owner[0]?.user_id : owner?.user_id
  if (ownerId !== user.id) {
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
