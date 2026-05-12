'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChannelBadge } from '@/components/outreach/ChannelBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, CheckCircle, Calendar, ChevronRight, Copy, Archive } from 'lucide-react'
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [savingNotes, setSavingNotes] = useState<string | null>(null)

  async function fetchOutreach() {
    const res = await fetch('/api/outreach')
    const data = await res.json()
    const items: OutreachWithLead[] = data.outreach ?? []
    setOutreach(items)
    setNotesMap(prev => {
      const next = { ...prev }
      for (const o of items) {
        if (!(o.id in next)) next[o.id] = o.notes ?? ''
      }
      return next
    })
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

  async function saveNotes(id: string) {
    setSavingNotes(id)
    await fetch(`/api/outreach/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesMap[id] ?? '' }),
    })
    setSavingNotes(null)
  }

  async function copyBody(id: string, body: string) {
    await navigator.clipboard.writeText(body)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const counts = {
    all: outreach.filter(o => o.status !== 'archived').length,
    draft: outreach.filter(o => o.status === 'draft').length,
    sent: outreach.filter(o => o.status === 'sent').length,
    replied: outreach.filter(o => o.status === 'replied').length,
    booked: outreach.filter(o => o.status === 'booked').length,
    archived: outreach.filter(o => o.status === 'archived').length,
  }

  const channels = [...new Set(outreach.map(o => o.channel))].sort()

  const visible = (
    filter === 'all'
      ? outreach.filter(o => o.status !== 'archived')
      : outreach.filter(o => o.status === filter)
  )
    .filter(o => channelFilter === 'all' || o.channel === channelFilter)
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

        {channels.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {(['all', ...channels] as string[]).map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  channelFilter === ch
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
                }`}
              >
                {ch === 'all' ? 'All channels' : ch.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}

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
                    <Link
                      href={`/dashboard/leads/${item.lead_id}`}
                      className="font-semibold text-zinc-900 text-sm hover:underline underline-offset-2"
                    >
                      {item.leads?.business_name ?? 'Unknown'}
                    </Link>
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
                    <span className="ml-auto text-xs text-zinc-300">
                      {new Date(item.created_at).toLocaleDateString('sv-SE')}
                    </span>
                  </div>

                  {item.subject && (
                    <p className="text-xs text-zinc-500 font-medium">
                      Ämne: {item.subject}
                    </p>
                  )}

                  <div className="relative">
                    <p
                      className={`text-sm text-zinc-600 pr-8 whitespace-pre-wrap cursor-pointer ${expandedId === item.id ? '' : 'line-clamp-2'}`}
                      onClick={() => setExpandedId(prev => prev === item.id ? null : item.id)}
                    >{item.body}</p>
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
                    {item.status !== 'archived' && item.status !== 'booked' && (
                      <Button
                        size="sm" variant="ghost"
                        loading={updating === item.id + 'archived'}
                        onClick={() => updateStatus(item.id, 'archived')}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-end gap-2">
                    <textarea
                      rows={1}
                      placeholder="Add a note…"
                      value={notesMap[item.id] ?? ''}
                      onChange={e => setNotesMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveNotes(item.id) } }}
                      className="flex-1 resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                    {(notesMap[item.id] ?? '') !== (item.notes ?? '') && (
                      <Button
                        size="sm" variant="outline"
                        loading={savingNotes === item.id}
                        onClick={() => saveNotes(item.id)}
                        className="h-7 text-xs"
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>

                <Link href={`/dashboard/leads/${item.lead_id}`} className="flex-shrink-0 mt-0.5" title="Open lead">
                  <ChevronRight className="h-4 w-4 text-zinc-300 hover:text-zinc-700 transition-colors" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
