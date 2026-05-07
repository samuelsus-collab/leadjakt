import type { OutreachChannel } from './lead'

export type OutreachStatus = 'draft' | 'sent' | 'replied' | 'booked' | 'archived'

export interface Outreach {
  id: string
  lead_id: string
  diagnosis_id: string | null
  channel: OutreachChannel
  subject: string | null
  body: string
  status: OutreachStatus
  sent_at: string | null
  replied_at: string | null
  booked_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
