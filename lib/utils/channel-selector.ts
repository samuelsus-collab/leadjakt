import type { OutreachChannel } from '@/types/lead'

const CHANNEL_MAP: Record<string, OutreachChannel> = {
  roofer: 'sms',
  plumber: 'sms',
  electrician: 'sms',
  painter: 'sms',
  carpenter: 'sms',
  landscaper: 'sms',
  hvac: 'sms',
  mechanic: 'sms',

  salon: 'instagram_dm',
  barber: 'instagram_dm',
  nail_salon: 'instagram_dm',
  spa: 'instagram_dm',
  tattoo: 'instagram_dm',
  photographer: 'instagram_dm',
  florist: 'instagram_dm',

  realtor: 'linkedin',
  accountant: 'linkedin',
  lawyer: 'linkedin',
  consultant: 'linkedin',
  financial_advisor: 'linkedin',
  architect: 'linkedin',
}

export function selectChannel(niche: string): OutreachChannel {
  const normalized = niche.toLowerCase().replace(/\s+/g, '_')
  return CHANNEL_MAP[normalized] ?? 'email'
}
