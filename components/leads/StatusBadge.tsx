import { Badge } from '@/components/ui/badge'
import type { LeadStatus } from '@/types/lead'

const STATUS_CONFIG: Record<LeadStatus, { label: string; variant: 'default' | 'secondary' | 'warning' | 'success' | 'destructive' | 'outline' }> = {
  new: { label: 'New', variant: 'secondary' },
  diagnosed: { label: 'Diagnosed', variant: 'warning' },
  outreach_ready: { label: 'Ready', variant: 'outline' },
  sent: { label: 'Sent', variant: 'default' },
  replied: { label: 'Replied', variant: 'warning' },
  booked: { label: 'Booked', variant: 'success' },
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const { label, variant } = STATUS_CONFIG[status]
  return <Badge variant={variant}>{label}</Badge>
}
