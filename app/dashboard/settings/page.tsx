'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  total_leads: number
  no_website: number
  diagnoses: number
  outreach_sent: number
  booked: number
}

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)
      setUserId(user?.id ?? null)

      const [leadsRes, diagRes, outRes] = await Promise.all([
        supabase.from('leads').select('status, has_website').eq('user_id', user!.id),
        // RLS filters diagnoses to this user's leads automatically
        supabase.from('diagnoses').select('id', { count: 'exact', head: true }),
        supabase.from('outreach').select('status'),
      ])

      const leads = leadsRes.data ?? []
      const outreach = outRes.data ?? []

      setStats({
        total_leads: leads.length,
        no_website: leads.filter(l => !l.has_website).length,
        diagnoses: diagRes.count ?? 0,
        outreach_sent: outreach.filter(o => ['sent', 'replied', 'booked'].includes(o.status)).length,
        booked: leads.filter(l => l.status === 'booked').length,
      })
      setLoading(false)
    }

    load()
  }, [])

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar title="Settings" />

      <div className="flex flex-col gap-5 p-6 max-w-lg">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Settings</h2>
          <p className="text-sm text-zinc-500">Account info and usage statistics</p>
        </div>

        {/* Account */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Account</h3>
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <span className="text-zinc-500">Email</span>
                <span className="font-medium text-zinc-900">{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">User ID</span>
                <span className="font-mono text-xs text-zinc-400">{userId?.slice(0, 8)}…</span>
              </div>
            </div>
          )}
        </div>

        {/* Usage stats */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Usage</h3>
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-0 divide-y divide-zinc-100 text-sm">
              {[
                { label: 'Total leads scouted', value: stats?.total_leads ?? 0 },
                { label: 'No-website leads', value: stats?.no_website ?? 0, highlight: true },
                { label: 'AI diagnoses run', value: stats?.diagnoses ?? 0 },
                { label: 'Messages sent', value: stats?.outreach_sent ?? 0 },
                { label: 'Deals booked', value: stats?.booked ?? 0, green: true },
              ].map(({ label, value, highlight, green }) => (
                <div key={label} className="flex items-center justify-between py-2.5">
                  <span className="text-zinc-500">{label}</span>
                  <span className={`font-bold ${highlight ? 'text-red-600' : green ? 'text-green-600' : 'text-zinc-900'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stack */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-4">Tech stack</h3>
          <div className="flex flex-col gap-0 divide-y divide-zinc-100 text-sm">
            {[
              { label: 'Framework', value: 'Next.js 16 App Router' },
              { label: 'Database + Auth', value: 'Supabase' },
              { label: 'AI model', value: 'Claude Sonnet 4.6' },
              { label: 'Deployment', value: 'Vercel' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <span className="text-zinc-500">{label}</span>
                <span className="text-zinc-700 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
