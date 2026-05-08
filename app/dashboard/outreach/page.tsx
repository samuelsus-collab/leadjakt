'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChannelBadge } from '@/components/outreach/ChannelBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, CheckCircle, Calendar, ChevronRight, Copy } from 'lucide-react'
import Link from 'next/link'
import type { Outreach } from '@/types/outreach'

interface OutreachWithLead extends Outreach {
  leads: {
    business_name: string
    city: string
    niche: string
    gap_score: number | null
    has_website: boolean
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  sent: 'bg-blue-100 text-blue-700',
  replied: 'bg-amber-100 text-amber-700',
  booked: 'bg-green-100 text-green-700',
  archived: 'bg-zinc-50 text-zinc-400',
}

export default function OutreachPage() {
  const [outreach, setOutreach] = useState<OutreachWithLead[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function fetchOutreach() {
    const res = await fetch('/api/outreach')
    const data = await res.json()
    setOutreach(data.outreach ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchOutreach() }, [])

  async function updateStatus(id: string, status: string) {
    setUpdating(id + status)
    await fetch(`/api/outreach/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchOutreach()
    setUpdating(null)
  }

  async function copyBody(id: string, body: string) {
    await navigator.clipboard.writeText(body)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const counts = {
    all: outreach.length,
    draft: outreach.filter(o => o.status === 'draft').length,
    sent: outreach.filter(o => o.status === 'sent').length,
    replied: outreach.filter(o => o.status === 'replied').length,
    booked: outreach.filter(o => o.status === 'booked').length,
  }

  const visible = (filter === 'all' ? outreach : outreach.filter(o => o.status === filter))
    .sort((a, b) => (b.leads?.gap_score ?? 0) - (a.leads?.gap_score ?? 0))

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar title="Outreach" />

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Outreach Queue</h2>
          <p className="text-sm text-zinc-500">Track all messages across channels</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(Object.entries(counts) as [string, number][]).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-zinc-900 text-white'
                  : status === 'all'
                  ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  : `${STATUS_COLORS[status]} hover:opacity-80`
              }`}
            >
              {count} {status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-12 text-center">
            <p className="text-sm text-zinc-500">No outreach yet.</p>
            <p className="text-xs text-zinc-400 mt-1">Diagnose leads in the Pipeline, then generate outreach.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex flex-1 flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-zinc-900 text-sm">
                      {item.leads?.business_name ?? 'Unknown'}
                    </p>
                    <span className="text-xs text-zinc-400">
                      {item.leads?.city} · {item.leads?.niche}
                    </span>
                    <ChannelBadge channel={item.channel} />
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[item.status]}`}>
                      {item.status}
                    </span>
                    {item.leads?.gap_score && item.leads.gap_score >= 7 && (
                      <Badge variant="destructive" className="text-[10px]">
                        Gap {item.leads.gap_score}/10
                      </Badge>
                    )}
                    {!item.leads?.has_website && (
                      <Badge variant="destructive" className="text-[10px]">Ingen hemsida</Badge>
                    )}
                  </div>

                  {item.subject && (
                    <p className="text-xs text-zinc-500 font-medium">
                      Ämne: {item.subject}
                    </p>
                  )}

                  <div className="relative">
                    <p className="text-sm text-zinc-600 line-clamp-2 pr-8">{item.body}</p>
                    <button
                      onClick={() => copyBody(item.id, item.body)}
                      className="absolute right-0 top-0 rounded p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                      title="Copy message"
                    >
                      {copiedId === item.id
                        ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {item.status === 'draft' && (
                      <Button
                        size="sm" variant="outline"
                        loading={updating === item.id + 'sent'}
                        onClick={() => updateStatus(item.id, 'sent')}
                      >
                        <Send className="h-3.5 w-3.5" /> Mark Sent
                      </Button>
                    )}
                    {item.status === 'sent' && (
                      <Button
                        size="sm" variant="outline"
                        loading={updating === item.id + 'replied'}
                        onClick={() => updateStatus(item.id, 'replied')}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Mark Replied
                      </Button>
                    )}
                    {item.status === 'replied' && (
                      <Button
                        size="sm"
                        loading={updating === item.id + 'booked'}
                        onClick={() => updateStatus(item.id, 'booked')}
                      >
                        <Calendar className="h-3.5 w-3.5" /> Mark Booked
                      </Button>
                    )}
                  </div>
                </div>

                <Link href={`/dashboard/leads/${item.lead_id}`} className="flex-shrink-0">
                  <ChevronRight className="h-4 w-4 text-zinc-400 hover:text-zinc-900 mt-0.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
