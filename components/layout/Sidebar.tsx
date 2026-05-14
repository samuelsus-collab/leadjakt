'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Search,
  Users,
  Send,
  Zap,
  LogOut,
  Settings,
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/scout', label: 'Scout', icon: Search },
  { href: '/dashboard/leads', label: 'Pipeline', icon: Users },
  { href: '/dashboard/outreach', label: 'Outreach', icon: Send },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .then(({ count }) => setNewCount(count ?? 0))
  }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-zinc-200 bg-white">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-zinc-900">LeadJakt</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {href === '/dashboard/leads' && newCount > 0 && (
                <span className={cn(
                  'flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  active ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'
                )}>
                  {newCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3 flex flex-col gap-1">
        <p className="px-3 text-[10px] text-zinc-400 font-medium tracking-wide">
          g→s Scout · g→p Pipeline · g→o Outreach
        </p>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
