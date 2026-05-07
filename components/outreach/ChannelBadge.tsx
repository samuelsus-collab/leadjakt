import { Badge } from '@/components/ui/badge'
import type { OutreachChannel } from '@/types/lead'
import { Mail, MessageSquare, Camera, Briefcase } from 'lucide-react'

const CONFIG: Record<OutreachChannel, { label: string; Icon: React.ElementType }> = {
  email: { label: 'Email', Icon: Mail },
  sms: { label: 'SMS', Icon: MessageSquare },
  instagram_dm: { label: 'Instagram', Icon: Camera },
  linkedin: { label: 'LinkedIn', Icon: Briefcase },
}

export function ChannelBadge({ channel }: { channel: OutreachChannel }) {
  const { label, Icon } = CONFIG[channel]
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}
