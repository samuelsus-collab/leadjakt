'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/leads/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, ChevronRight, Search, Zap, Phone, Send, Globe } from 'lucide-react'
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
  const [diagnosingIds, setDiagnosingIds] = useState<Set<string>>(new Set())
  const [outreachIds, setOutreachIds] = useState<Set<string>>(new Set())
  const [bulkDiagnosing, setBulkDiagnosing] = useState(false)
  const [bulkOutreaching, setBulkOutreaching] = useState(false)
  const [search, setSearch] = useState('')
  const [nicheFilter, setNicheFilter] = useState('')
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false)

  async function fetchLeads() {
    const res = await fetch('/api/leads?limit=200')
    const data = await res.json()
    setLeads(data.leads ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [])

  async function diagnose(lead: Lead) {
    setDiagnosingIds(prev => new Set(prev).add(lead.id))
    await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id }),
    })
    setDiagnosingIds(prev => { const n = new Set(prev); n.delete(lead.id); return n })
    fetchLeads()
  }

  async function generateOutreach(lead: Lead) {
    setOutreachIds(prev => new Set(prev).add(lead.id))
    await fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id }),
    })
    setOutreachIds(prev => { const n = new Set(prev); n.delete(lead.id); return n })
    fetchLeads()
  }

  async function bulkDiagnose() {
    const newLeads = leads.filter(l => l.status === 'new')
    if (!newLeads.length) return
    setBulkDiagnosing(true)
    setDiagnosingIds(new Set(newLeads.map(l => l.id)))
    for (const lead of newLeads) {
      await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id }),
      })
      setDiagnosingIds(prev => { const n = new Set(prev); n.delete(lead.id); return n })
    }
    setBulkDiagnosing(false)
    fetchLeads()
  }

  async function bulkOutreach() {
    const diagnosedLeads = leads.filter(l => l.status === 'diagnosed')
    if (!diagnosedLeads.length) return
    setBulkOutreaching(true)
    setOutreachIds(new Set(diagnosedLeads.map(l => l.id)))
    for (const lead of diagnosedLeads) {
      await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id }),
      })
      setOutreachIds(prev => { const n = new Set(prev); n.delete(lead.id); return n })
    }
    setBulkOutreaching(false)
    fetchLeads()
  }

  const niches = [...new Set(leads.map(l => l.niche))].sort()
  const q = search.toLowerCase()
  const byStatus = (status: LeadStatus) =>
    leads
      .filter(l => l.status === status)
      .filter(l => !nicheFilter || l.niche === nicheFilter)
      .filter(l => !noWebsiteOnly || !l.has_website)
      .filter(l =>
        !q ||
        l.business_name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.niche.toLowerCase().includes(q)
      )
      .sort((a, b) => (a.has_website ? 1 : -1) - (b.has_website ? 1 : -1))

  const newCount = leads.filter(l => l.status === 'new' && (!nicheFilter || l.niche === nicheFilter) && (!noWebsiteOnly || !l.has_website)).length
  const diagnosedCount = leads.filter(l => l.status === 'diagnosed' && (!nicheFilter || l.niche === nicheFilter) && (!noWebsiteOnly || !l.has_website)).length

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Pipeline" />

      <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2 flex-wrap">
        <span className="text-xs font-semibold text-zinc-500">
          {leads.length} leads
        </span>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Filter by name, city, niche…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        {niches.length > 0 && (
          <select
            value={nicheFilter}
            onChange={e => setNicheFilter(e.target.value)}
            className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">All niches</option>
            {niches.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}
        <button
          onClick={() => setNoWebsiteOnly(v => !v)}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
            noWebsiteOnly
              ? 'border-red-400 bg-red-50 text-red-700'
              : 'border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          Ingen hemsida
        </button>
        {newCount > 0 && (
          <Button size="sm" variant="outline" loading={bulkDiagnosing} onClick={bulkDiagnose}>
            <Zap className="h-3.5 w-3.5" />
            Diagnose all new ({newCount})
          </Button>
        )}
        {diagnosedCount > 0 && (
          <Button size="sm" variant="outline" loading={bulkOutreaching} onClick={bulkOutreach}>
            <Send className="h-3.5 w-3.5" />
            Outreach all diagnosed ({diagnosedCount})
          </Button>
        )}
      </div>

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

                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-14rem)]">
                    {columnLeads.map(lead => (
                      <Link
                        key={lead.id}
                        href={`/dashboard/leads/${lead.id}`}
                        className={`block rounded-xl border p-3 text-sm transition-shadow hover:shadow-md ${
                          !lead.has_website
                            ? 'border-red-200 bg-red-50'
                            : 'border-zinc-200 bg-white'
                        }`}
                        onClick={e => {
                          // prevent navigation when action buttons are clicked
                          if ((e.target as HTMLElement).closest('button')) e.preventDefault()
                        }}
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-1">
                          <p className="font-semibold text-zinc-900 leading-tight">
                            {lead.business_name}
                          </p>
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-400" />
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
                          <p className="flex items-center gap-1 text-xs text-zinc-400 mb-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {lead.google_rating} ({lead.review_count})
                          </p>
                        )}

                        {lead.phone && (
                          <p className="flex items-center gap-1 text-xs text-zinc-400 mb-2">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </p>
                        )}

                        {status === 'new' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full text-xs h-7"
                            loading={diagnosingIds.has(lead.id)}
                            onClick={() => diagnose(lead)}
                          >
                            {diagnosingIds.has(lead.id) ? 'Diagnosing...' : 'Diagnose'}
                          </Button>
                        )}
                        {status === 'diagnosed' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full text-xs h-7"
                            loading={outreachIds.has(lead.id)}
                            onClick={() => generateOutreach(lead)}
                          >
                            {outreachIds.has(lead.id) ? 'Generating...' : 'Generate Outreach'}
                          </Button>
                        )}
                      </Link>
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
