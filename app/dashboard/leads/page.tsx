'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/leads/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, Globe, Phone, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Lead, LeadStatus } from '@/types/lead'

const COLUMNS: { status: LeadStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'diagnosed', label: 'Diagnosed' },
  { status: 'outreach_ready', label: 'Ready' },
  { status: 'sent', label: 'Sent' },
  { status: 'replied', label: 'Replied' },
  { status: 'booked', label: 'Booked' },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchLeads() {
    const res = await fetch('/api/leads?limit=200')
    const data = await res.json()
    setLeads(data.leads ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [])

  async function diagnose(lead: Lead) {
    await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id }),
    })
    fetchLeads()
  }

  async function generateOutreach(lead: Lead) {
    await fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id }),
    })
    fetchLeads()
  }

  const byStatus = (status: LeadStatus) =>
    leads
      .filter(l => l.status === status)
      .sort((a, b) => (a.has_website ? 1 : -1) - (b.has_website ? 1 : -1))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Pipeline" />

      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-full w-44 flex-shrink-0 rounded-xl" />
            ))
          : COLUMNS.map(({ status, label }) => {
              const columnLeads = byStatus(status)
              return (
                <div
                  key={status}
                  className="flex w-60 flex-shrink-0 flex-col gap-2"
                >
                  <div className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2">
                    <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-xs font-bold text-zinc-900">
                      {columnLeads.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 overflow-y-auto">
                    {columnLeads.map(lead => (
                      <div
                        key={lead.id}
                        className={`rounded-xl border p-3 text-sm ${
                          !lead.has_website
                            ? 'border-red-200 bg-red-50'
                            : 'border-zinc-200 bg-white'
                        }`}
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-1">
                          <p className="font-semibold text-zinc-900 leading-tight">
                            {lead.business_name}
                          </p>
                          <Link href={`/dashboard/leads/${lead.id}`}>
                            <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-400 hover:text-zinc-900" />
                          </Link>
                        </div>

                        <p className="text-xs text-zinc-500 mb-2">{lead.city} · {lead.niche}</p>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {!lead.has_website && (
                            <Badge variant="destructive" className="text-[10px]">Ingen hemsida</Badge>
                          )}
                          {lead.gap_score && lead.gap_score >= 8 && (
                            <Badge variant="destructive" className="text-[10px]">Gap {lead.gap_score}/10</Badge>
                          )}
                        </div>

                        {lead.google_rating && (
                          <p className="flex items-center gap-1 text-xs text-zinc-400 mb-2">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {lead.google_rating} ({lead.review_count})
                          </p>
                        )}

                        {status === 'new' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full text-xs h-7"
                            onClick={() => diagnose(lead)}
                          >
                            Diagnose
                          </Button>
                        )}
                        {status === 'diagnosed' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full text-xs h-7"
                            onClick={() => generateOutreach(lead)}
                          >
                            Generate Outreach
                          </Button>
                        )}
                      </div>
                    ))}

                    {columnLeads.length === 0 && (
                      <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400">
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
      </div>
    </div>
  )
}
