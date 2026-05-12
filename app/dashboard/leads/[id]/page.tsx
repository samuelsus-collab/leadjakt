'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/leads/StatusBadge'
import { ChannelBadge } from '@/components/outreach/ChannelBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import {
  Star, Phone, MapPin, ArrowLeft, ExternalLink, Globe,
  Zap, Send, CheckCircle, Calendar, Copy, Trash2, Save, Pencil, X,
} from 'lucide-react'
import type { Lead, OutreachChannel } from '@/types/lead'
import type { Diagnosis } from '@/types/diagnosis'
import type { Outreach } from '@/types/outreach'

interface LeadDetail extends Lead {
  diagnoses: Diagnosis[]
  outreach: Outreach[]
}

const CHANNELS: { value: OutreachChannel; label: string }[] = [
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'instagram_dm', label: 'Instagram DM' },
  { value: 'linkedin', label: 'LinkedIn' },
]

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [diagnosing, setDiagnosing] = useState(false)
  const [generatingOutreach, setGeneratingOutreach] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<OutreachChannel | ''>('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [savingContact, setSavingContact] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [editingInfo, setEditingInfo] = useState(false)
  const [infoEdits, setInfoEdits] = useState({ business_name: '', city: '', niche: '' })
  const [savingInfo, setSavingInfo] = useState(false)

  async function fetchLead() {
    const res = await fetch(`/api/leads/${id}`)
    const data = await res.json()
    setLead(data.lead)
    setEmail(data.lead?.email ?? '')
    setNotes(data.lead?.notes ?? '')
    setInfoEdits({ business_name: data.lead?.business_name ?? '', city: data.lead?.city ?? '', niche: data.lead?.niche ?? '' })
    setLoading(false)
  }

  useEffect(() => { fetchLead() }, [id])

  async function handleDiagnose(force = false) {
    setDiagnosing(true)
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: id, force }),
    })
    await fetchLead()
    setDiagnosing(false)
    if (res.ok) toast('Diagnosis complete')
    else toast('Diagnosis failed', 'error')
  }

  async function handleGenerateOutreach() {
    setGeneratingOutreach(true)
    const res = await fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: id, channel: selectedChannel || undefined }),
    })
    await fetchLead()
    setGeneratingOutreach(false)
    if (res.ok) toast('Outreach message generated')
    else toast('Failed to generate outreach', 'error')
  }

  async function handleDelete() {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    router.push('/dashboard/leads')
  }

  async function handleSaveContact() {
    setSavingContact(true)
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email || null, notes: notes || null }),
    })
    setSavingContact(false)
    if (res.ok) toast('Contact info saved')
    else toast('Save failed', 'error')
  }

  async function handleSaveInfo() {
    setSavingInfo(true)
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(infoEdits),
    })
    await fetchLead()
    setSavingInfo(false)
    setEditingInfo(false)
    if (res.ok) toast('Lead info updated')
    else toast('Save failed', 'error')
  }

  async function handleStatusChange(status: string) {
    setChangingStatus(true)
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchLead()
    setChangingStatus(false)
    toast(`Status → ${status}`, 'info')
  }

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(key)
    setTimeout(() => setCopiedId(null), 2000)
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
  const allOutreach = lead.outreach ?? []

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
            <div className="flex-1 min-w-0">
              {editingInfo ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={infoEdits.business_name}
                    onChange={e => setInfoEdits(p => ({ ...p, business_name: e.target.value }))}
                    className="h-8 text-sm font-bold"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={infoEdits.niche}
                      onChange={e => setInfoEdits(p => ({ ...p, niche: e.target.value }))}
                      className="h-7 text-xs"
                      placeholder="Niche"
                    />
                    <Input
                      value={infoEdits.city}
                      onChange={e => setInfoEdits(p => ({ ...p, city: e.target.value }))}
                      className="h-7 text-xs"
                      placeholder="City"
                    />
                    <Button size="sm" loading={savingInfo} onClick={handleSaveInfo} className="h-7 px-2">
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingInfo(false)} className="h-7 px-2">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-1.5">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">{lead.business_name}</h2>
                    <p className="text-sm text-zinc-500">{lead.niche} · {lead.city}</p>
                  </div>
                  <button
                    onClick={() => setEditingInfo(true)}
                    className="mt-1 rounded p-0.5 text-zinc-300 hover:text-zinc-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {!editingInfo && (
              <div className="flex items-center gap-2">
                <StatusBadge status={lead.status} />
                <select
                  value={lead.status}
                  disabled={changingStatus}
                  onChange={e => handleStatusChange(e.target.value)}
                  className="h-7 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
                >
                  <option value="new">new</option>
                  <option value="diagnosed">diagnosed</option>
                  <option value="outreach_ready">outreach_ready</option>
                  <option value="sent">sent</option>
                  <option value="replied">replied</option>
                  <option value="booked">booked</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-zinc-600">
            {lead.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{lead.address}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1 group">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                <button
                  onClick={() => copyText('phone', lead.phone!)}
                  className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-zinc-400 hover:text-zinc-700 transition-all"
                  title="Copy phone"
                >
                  {copiedId === 'phone'
                    ? <CheckCircle className="h-3 w-3 text-green-500" />
                    : <Copy className="h-3 w-3" />}
                </button>
              </span>
            )}
            {lead.google_rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {lead.google_rating} ({lead.review_count} reviews)
              </span>
            )}
            {lead.source_url && (
              <a
                href={lead.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Google Maps
              </a>
            )}
          </div>

          {lead.has_website && lead.website_url && (
            <div className="mt-2">
              <a
                href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {lead.website_url}
              </a>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {!lead.has_website && <Badge variant="destructive">Ingen hemsida</Badge>}
            {lead.gap_score && <Badge variant="warning">Gap score: {lead.gap_score}/10</Badge>}
            {lead.years_on_map && <Badge variant="secondary">{lead.years_on_map}+ år aktiva</Badge>}
            {lead.website_age && <Badge variant="secondary">Hemsida ~{lead.website_age} år gammal</Badge>}
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Scouted {new Date(lead.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Contact details */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-3">Contact</h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="kontakt@foretaget.se"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Anteckningar om detta lead…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-fit"
              loading={savingContact}
              onClick={handleSaveContact}
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-900">AI Diagnosis</h3>
            {diagnosis ? (
              <Button size="sm" variant="outline" loading={diagnosing} onClick={() => handleDiagnose(true)}>
                <Zap className="h-4 w-4" />
                Re-diagnose
              </Button>
            ) : (
              <Button size="sm" loading={diagnosing} onClick={() => handleDiagnose()}>
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
                <div className="relative">
                  <Textarea
                    defaultValue={diagnosis.suggested_message}
                    rows={4}
                    className="text-sm pr-9"
                  />
                  <button
                    onClick={() => copyText('suggestion', diagnosis.suggested_message)}
                    className="absolute right-2 top-2 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                    title="Copy"
                  >
                    {copiedId === 'suggestion'
                      ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
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
              <div className="flex items-center gap-2">
                <select
                  value={selectedChannel}
                  onChange={e => setSelectedChannel(e.target.value as OutreachChannel | '')}
                  className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Auto channel</option>
                  {CHANNELS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <Button size="sm" loading={generatingOutreach} onClick={handleGenerateOutreach}>
                  <Send className="h-4 w-4" />
                  {allOutreach.length > 0 ? 'Regenerate' : 'Generate'}
                </Button>
              </div>
            )}
          </div>

          {generatingOutreach && allOutreach.length === 0 && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {allOutreach.length > 0 ? (
            <div className="flex flex-col gap-4">
              {allOutreach.map((outreach, idx) => (
                <div key={outreach.id} className={`flex flex-col gap-3 ${idx > 0 ? 'border-t border-zinc-100 pt-4' : ''}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChannelBadge channel={outreach.channel} />
                    <Badge variant={
                      outreach.status === 'booked' ? 'success' :
                      outreach.status === 'replied' ? 'warning' :
                      outreach.status === 'sent' ? 'default' : 'secondary'
                    }>
                      {outreach.status}
                    </Badge>
                    {outreach.sent_at && (
                      <span className="text-xs text-zinc-400">
                        Sent {new Date(outreach.sent_at).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                    {idx > 0 && (
                      <span className="text-xs text-zinc-400">
                        {new Date(outreach.created_at).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                  </div>

                  {outreach.subject && (
                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide mr-2">Ämne:</span>
                      <span className="text-zinc-700">{outreach.subject}</span>
                    </div>
                  )}

                  <div className="relative rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 whitespace-pre-wrap">
                    {outreach.body}
                    <button
                      onClick={() => copyText(outreach.id, outreach.body)}
                      className="absolute right-2 top-2 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                      title="Copy message"
                    >
                      {copiedId === outreach.id
                        ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        : <Copy className="h-3.5 w-3.5" />}
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
                </div>
              ))}
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
