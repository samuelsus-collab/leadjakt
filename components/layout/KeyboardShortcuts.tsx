'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const GOTO_MAP: Record<string, string> = {
  d: '/dashboard',
  s: '/dashboard/scout',
  p: '/dashboard/leads',
  o: '/dashboard/outreach',
}

export function KeyboardShortcuts() {
  const router = useRouter()
  const pendingG = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (['input', 'textarea', 'select'].includes(tag)) return

      if (e.key === 'g') {
        pendingG.current = true
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => { pendingG.current = false }, 1000)
        return
      }

      if (pendingG.current && GOTO_MAP[e.key]) {
        pendingG.current = false
        if (timer.current) clearTimeout(timer.current)
        router.push(GOTO_MAP[e.key])
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [router])

  return null
}
