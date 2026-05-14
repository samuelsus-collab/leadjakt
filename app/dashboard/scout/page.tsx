'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Globe, AlertCircle, CheckCircle, Star, MapPin, Phone } from 'lucide-react'
import type { ScoutResult } from '@/types/lead'

const DEFAULT_NICHES = [
  'Roofer', 'Plumber', 'Electrician', 'Painter', 'Carpenter',
  'Salon', 'Barber', 'Nail salon', 'Spa', 'Landscaper',
  'Dentist', 'Realtor', 'Restaurant', 'Mechanic', 'Photographer',
]

export default function ScoutPage() {
  const [niche, setNiche] = useState('')
  const [city, setCity] = useState('')
  const [count, setCount] = useState(10)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('scout_last')
      if (saved) {
        const { niche: n, city: c, count: ct } = JSON.parse(saved)
        if (n) setNiche(n)
        if (c) setCity(c)
        if (ct) setCount(ct)
      }
    } catch {}
  }, [])
  const [results, setResults] = useState<ScoutResult[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [savedNoWebCount, setSavedNoWebCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)

  async function handleScout(e: React.FormEvent) {
    e.preventDefault()
    try { localStorage.setItem('scout_last', JSON.stringify({ niche, city, count })) } catch {}
    setResults([])
    setDone(false)
    setError(null)
    setSelected(new Set())
    setSavedCount(0)
    setLoading(true)

    const response = await fetch('/api/scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, city, count }),
    })

    if (!response.body) { setLoading(false); return }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done: streamDone, value } = await reader.read()
      if (streamDone) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)
          if (parsed.done) {
            setDone(true)
          } else if (parsed.error) {
            setError(parsed.error as string)
          } else {
            const result = parsed as ScoutResult
            setResults(prev => {
              if (!result.has_website) {
                setSelected(s => new Set(s).add(prev.length))
              }
              return [...prev, result]
            })
          }
        } catch {}
      }
    }

    setLoading(false)
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(results.map((_, i) => i)))
  }

  async function handleSave() {
    const toSave = results.filter((_, i) => selected.has(i))
    if (!toSave.length) return

    setSaving(true)
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads: toSave, niche, city }),
    })

    if (res.ok) {
      const data = await res.json()
      const saved: { has_website?: boolean }[] = data.leads ?? []
      setSavedCount(saved.length)
      setSkippedCount(data.skipped ?? 0)
      // store no-website count for banner
      const noWebSaved = toSave.filter(l => !l.has_website).length
      setSavedNoWebCount(noWebSaved)
      setSelected(new Set())
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar title="Scout" />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Find Leads</h2>
          <p className="text-sm text-zinc-500">Claude searches for real businesses using web search</p>
        </div>

        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleScout} className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  ...DEFAULT_NICHES,
                  ...(niche && !DEFAULT_NICHES.some(n => n.toLowerCase() === niche.toLowerCase())
                    ? [niche.charAt(0).toUpperCase() + niche.slice(1)]
                    : []),
                ].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNiche(n.toLowerCase())}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      niche.toLowerCase() === n.toLowerCase()
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="niche">Niche</Label>
                  <Input
                    id="niche"
                    placeholder="e.g. roofer"
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Stockholm"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="count">Count</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={20}
                    value={count}
                    onChange={e => setCount(parseInt(e.target.value) || 10)}
                  />
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-fit">
                <Search className="h-4 w-4" />
                {loading ? 'Searching...' : 'Find Leads'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading && results.length === 0 && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
            <p className="text-center text-sm text-zinc-400">Claude is searching the web... this takes 20-40s</p>
          </div>
        )}

        {loading && results.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Found {results.length} so far — still searching…
          </div>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-700">
                {results.length} businesses found
                {loading && ' (streaming...)'}
                {done && ' · done'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select all
                </Button>
                {selected.size > 0 && (
                  <Button size="sm" loading={saving} onClick={handleSave}>
                    Save {selected.size} to pipeline
                  </Button>
                )}
              </div>
            </div>

            {savedCount > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 text-sm text-green-700">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {savedCount} lead{savedCount !== 1 ? 's' : ''} saved
                  {savedNoWebCount > 0 && ` · ${savedNoWebCount} without website 🔴`}
                  {skippedCount > 0 && ` · ${skippedCount} skipped (already saved)`}
                </span>
                <a href="/dashboard/leads" className="font-medium underline underline-offset-2 hover:no-underline">
                  View pipeline →
                </a>
              </div>
            )}

            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => toggleSelect(i)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  !r.has_website
                    ? 'border-red-200 bg-red-50 hover:border-red-400'
                    : 'border-zinc-200 bg-white hover:border-zinc-400'
                } ${selected.has(i) ? 'ring-2 ring-zinc-900 ring-offset-1' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-900">{r.business_name}</p>
                      {!r.has_website && (
                        <Badge variant="destructive" className="text-[10px]">Ingen hemsida</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      {r.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {r.address}
                        </span>
                      )}
                      {r.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {r.phone}
                        </span>
                      )}
                      {r.google_rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {r.google_rating} ({r.review_count} reviews)
                        </span>
                      )}
                      {r.years_on_map && (
                        <span>{r.years_on_map}+ years active</span>
                      )}
                    </div>

                    {r.has_website && r.website_url && (
                      <p className="flex items-center gap-1 text-xs text-zinc-400">
                        <Globe className="h-3 w-3" />
                        {r.website_url}
                        {r.website_age && ` (last updated ~${r.website_age})`}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {selected.has(i) ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900">
                        <CheckCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-zinc-300" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
