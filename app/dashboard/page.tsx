'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Download, Search, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Lead, PipelineMetrics } from '@/types/lead'

const EXPORT_STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'diagnosed', label: 'Diagnosed' },
  { value: 'outreach_ready', label: 'Ready' },
  { value: 'sent', label: 'Sent' },
  { value: 'replied', label: 'Replied' },
  { value: 'booked', label: 'Booked' },
]

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null)
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [exportStatus, setExportStatus] = useState('')

  useEffect(() => {
    fetch('/api/leads?limit=5')
      .then(r => r.json())
      .then(d => { setMetrics(d.metrics); setRecentLeads(d.leads ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleExport() {
    const url = exportStatus ? `/api/export?status=${exportStatus}` : '/api/export'
    window.location.href = url
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar title="Dashboard" />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Overview</h2>
            <p className="text-sm text-zinc-500">Your lead generation pipeline at a glance</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={exportStatus}
              onChange={e => setExportStatus(e.target.value)}
              className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              {EXPORT_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {!loading && metrics?.total === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white p-12 text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <Search className="h-6 w-6 text-zinc-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">No leads yet</p>
              <p className="text-sm text-zinc-500 mt-1">Scout for local businesses to fill your pipeline</p>
            </div>
            <Link href="/dashboard/scout">
              <Button>Go to Scout</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))
            ) : (
              <>
                <MetricCard label="Total Leads" value={metrics?.total ?? 0} sub="all time" />
                <MetricCard label="No Website" value={metrics?.no_website ?? 0} sub="hottest leads" highlight="red" />
                <MetricCard label="Reply Rate" value={`${metrics?.reply_rate ?? 0}%`} sub="of sent messages" />
                <MetricCard label="Booked" value={metrics?.booked ?? 0} sub="calls scheduled" highlight="green" />
              </>
            )}
          </div>
        )}

        {!loading && metrics && metrics.total > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-zinc-900">Pipeline breakdown</h3>
            <div className="flex flex-col gap-2">
              {(Object.entries(metrics.by_status) as [string, number][]).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-zinc-500 capitalize">{status.replace('_', ' ')}</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-900 transition-all"
                      style={{ width: metrics.total > 0 ? `${(count / metrics.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-semibold text-zinc-700">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && recentLeads.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-zinc-900">Recently added</h3>
              <Link href="/dashboard/leads" className="text-xs text-zinc-400 hover:text-zinc-700">
                View all →
              </Link>
            </div>
            <div className="flex flex-col divide-y divide-zinc-100">
              {recentLeads.map(lead => (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="flex items-center justify-between py-2.5 hover:bg-zinc-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-900">{lead.business_name}</span>
                    <span className="text-xs text-zinc-400">{lead.city} · {lead.niche}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!lead.has_website && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">no website</span>
                    )}
                    <span className="text-xs text-zinc-400">{new Date(lead.created_at).toLocaleDateString('sv-SE')}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-zinc-900">Quick start</h3>
          <ol className="flex flex-col gap-2 text-sm text-zinc-600">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">1</span>
              Go to <strong className="text-zinc-900">Scout</strong> — enter a niche and city, find businesses
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">2</span>
              Save leads to the <strong className="text-zinc-900">Pipeline</strong> — no-website leads highlighted in red
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">3</span>
              Click <strong className="text-zinc-900">Diagnose</strong> on each lead — AI analyzes their digital gap
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">4</span>
              Generate a personalized Swedish <strong className="text-zinc-900">cold message</strong> and send it
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
