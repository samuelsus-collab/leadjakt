'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <h1 className="text-sm font-semibold text-zinc-900">{title}</h1>
      <Button variant="ghost" size="sm" onClick={signOut}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </header>
  )
}
