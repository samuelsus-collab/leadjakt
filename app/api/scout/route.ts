import { NextResponse } from 'next/server'
import { runScoutAgent } from '@/lib/anthropic/scout-agent'
import { createClient } from '@/lib/supabase/server'
import type { ScoutResult } from '@/types/lead'

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { niche, city, count } = await request.json() as {
    niche: string
    city: string
    count: number
  }

  if (!niche || !city) {
    return NextResponse.json({ error: 'niche and city are required' }, { status: 400 })
  }

  const safeCount = Math.min(20, Math.max(1, count ?? 10))

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        await runScoutAgent(niche, city, safeCount, (result: ScoutResult) => {
          const line = JSON.stringify(result) + '\n'
          controller.enqueue(encoder.encode(line))
        })

        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Scout failed'
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg }) + '\n'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  })
}
