'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/leads/StatusBadge'
import { ChannelBadge } from '@/components/outreach/ChannelBadge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Star, Globe, Phone, MapPin, ArrowLeft,
  Zap, Send, CheckCircle, Calendar, Copy, Trash2
} from 'lucide-react'
import type { Lead } from '@/types/lead'
import type { Diagnosis } from '@/types/diagnosis'
import type { Outreach } from '@/types/outreach'

interface LeadDetail extends Lead {
  diagnoses: Diagnosis[]
  outreach: Outreach[]
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [diagnosing, setDiagnosing] = useState(false)
  const [generatingOutreach, setGeneratingOutreach] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  async function fetchLead() {
    const res = await fetch(`/api/leads/${id}`)
    const data = await res.json()
    setLead(data.lead)
    setLoading(false)
  }

  useEffect(() => { fetchLead() }, [id])

  async function handleDiagnose() {
    setDiagnosing(true)
    await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: id }),
    })
    await fetchLead()
    setDiagnosing(false)
  }

  async function handleGenerateOutreach() {
    setGeneratingOutreach(true)
    await fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: id }),
    })
    await fetchLead()
    setGeneratingOutreach(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    router.push('/dashboard/leads')
  }

  async function copyOutreach(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function updateOutreachStatus(outreachId: string, status: string) {
    setUpdatingStatus(outreachId + status)
    await fetch(`/api/outreach/${outreachId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchLead()
    setUpdatingStatus(null)
  }

  if (loading) return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar title="Lead Detail" />
      <div className="flex flex-col gap-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )

  if (!lead) return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar title="Lead Detail" />
      <p className="p-6 text-zinc-500">Lead not found.</p>
    </div>
  )

  const diagnosis = lead.diagnoses?.[0]
  const outreach = lead.outreach?.[0]

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar title={lead.business_name} />

      <div className="flex flex-col gap-5 p-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to pipeline
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={deleting}
            onClick={handleDelete}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete lead
          </Button>
        </div>

        {/* Lead info */}
        <div className={`rounded-xl border p-5 ${!lead.has_website ? 'border-red-200 bg-red-50' : 'border-zinc-200 bg-white'}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">{lead.business_name}</h2>
              <p className="text-sm text-zinc-500">{lead.niche} · {lead.city}</p>
            </div>
            <StatusBadge status={lead.status} />
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-zinc-600">
            {lead.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{lead.address}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />{lead.phone}
              </span>
            )}
            {lead.google_rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {lead.google_rating} ({lead.review_count} reviews)
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!lead.has_website && <Badge variant="destructive">Ingen hemsida</Badge>}
            {lead.gap_score && <Badge variant="warning">Gap score: {lead.gap_score}/10</Badge>}
            {lead.years_on_map && <Badge variant="secondary">{lead.years_on_map}+ år aktiva</Badge>}
          </div>
        </div>

        {/* Diagnosis */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-900">AI Diagnosis</h3>
            {!diagnosis && (
              <Button size="sm" loading={diagnosing} onClick={handleDiagnose}>
                <Zap className="h-4 w-4" />
                Run Diagnosis
              </Button>
            )}
          </div>

          {diagnosing && !diagnosis && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <p className="text-xs text-zinc-400 mt-1">Claude is analyzing... ~10s</p>
            </div>
          )}

          {diagnosis ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Summary</p>
                <p className="text-sm text-zinc-700">{diagnosis.summary}</p>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Hero Angle</p>
                  <p className="text-sm text-zinc-700">{diagnosis.hero_angle}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Tone</p>
                  <Badge variant="secondary">{diagnosis.tone}</Badge>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Gap Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${diagnosis.gap_score >= 8 ? 'bg-red-500' : diagnosis.gap_score >= 5 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${diagnosis.gap_score * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-zinc-900">{diagnosis.gap_score}/10</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Cold Message (Swedish)</p>
                <Textarea
                  defaultValue={diagnosis.suggested_message}
                  rows={4}
                  className="text-sm"
                />
              </div>
            </div>
          ) : !diagnosing && (
            <p className="text-sm text-zinc-400">No diagnosis yet. Run one to get a hero angle, gap score, and cold message.</p>
          )}
        </div>

        {/* Outreach */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-900">Outreach</h3>
            {diagnosis && (
              <Button size="sm" loading={generatingOutreach} onClick={handleGenerateOutreach}>
                <Send className="h-4 w-4" />
                {outreach ? 'Regenerate' : 'Generate Outreach'}
              </Button>
            )}
          </div>

          {generatingOutreach && !outreach && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {outreach ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ChannelBadge channel={outreach.channel} />
                <Badge variant={
                  outreach.status === 'booked' ? 'success' :
                  outreach.status === 'replied' ? 'warning' :
                  outreach.status === 'sent' ? 'default' : 'secondary'
                }>
                  {outreach.status}
                </Badge>
              </div>

              <div className="relative rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 whitespace-pre-wrap">
                {outreach.body}
                <button
                  onClick={() => copyOutreach(outreach.body)}
                  className="absolute right-2 top-2 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                  title="Copy message"
                >
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {outreach.status === 'draft' && (
                  <Button
                    size="sm" variant="outline"
                    loading={updatingStatus === outreach.id + 'sent'}
                    onClick={() => updateOutreachStatus(outreach.id, 'sent')}
                  >
                    <Send className="h-3.5 w-3.5" /> Mark Sent
                  </Button>
                )}
                {outreach.status === 'sent' && (
                  <Button
                    size="sm" variant="outline"
                    loading={updatingStatus === outreach.id + 'replied'}
                    onClick={() => updateOutreachStatus(outreach.id, 'replied')}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Mark Replied
                  </Button>
                )}
                {outreach.status === 'replied' && (
                  <Button
                    size="sm"
                    loading={updatingStatus === outreach.id + 'booked'}
                    onClick={() => updateOutreachStatus(outreach.id, 'booked')}
                  >
                    <Calendar className="h-3.5 w-3.5" /> Mark Booked
                  </Button>
                )}
              </div>

              {outreach.sent_at && (
                <p className="text-xs text-zinc-400">Sent {new Date(outreach.sent_at).toLocaleDateString()}</p>
              )}
            </div>
          ) : !generatingOutreach && (
            <p className="text-sm text-zinc-400">
              {diagnosis ? 'Generate a personalized outreach message.' : 'Run diagnosis first.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
