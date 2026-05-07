'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Search,
  Users,
  Send,
  Zap,
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/scout', label: 'Scout', icon: Search },
  { href: '/dashboard/leads', label: 'Pipeline', icon: Users },
  { href: '/dashboard/outreach', label: 'Outreach', icon: Send },
]

export function Sidebar() {
  const pathname = usePathname()

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
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
