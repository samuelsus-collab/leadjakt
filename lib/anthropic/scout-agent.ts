import Anthropic from '@anthropic-ai/sdk'
import { anthropic } from './client'
import type { ScoutResult } from '@/types/lead'

const SCOUT_SYSTEM = `You are a lead generation specialist finding small local businesses that need web services.
Use web_search to find REAL businesses from Google Maps and Google Search results.

For each business you find, extract:
- Exact business name
- Full street address
- Phone number (if visible)
- Google Maps star rating (e.g. 4.2)
- Total review count
- Approximate years on Google Maps (look for earliest reviews or "on Google since")
- Whether they have a working website (not just a Google Business listing page)
- Website URL if present
- Google Maps listing URL

Only include businesses matching ALL criteria:
1. Operational for 5+ years (based on review history or founding date)
2. Fewer than 50 Google reviews
3. Either NO website, or a website that appears outdated (last updated before 2020)
4. Rating 3.5 stars or higher (they do good work but have no online presence)

Respond with ONLY a valid JSON array of objects. No markdown, no explanation. Just the JSON array.`

export async function runScoutAgent(
  niche: string,
  city: string,
  count: number,
  onResult: (result: ScoutResult) => void
): Promise<void> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Find ${count} ${niche} businesses in ${city} matching the criteria.
Search Google Maps for "${niche} ${city}" and related queries like "${niche} near ${city}".
Do multiple searches to find enough qualifying businesses.

Return a JSON array where each object has exactly these fields:
{
  "business_name": string,
  "address": string,
  "city": "${city}",
  "phone": string | null,
  "google_rating": number | null,
  "review_count": number | null,
  "years_on_map": number | null,
  "has_website": boolean,
  "website_url": string | null,
  "website_age": number | null,
  "source_url": string | null
}`,
    },
  ]

  // web_search is a server-side tool: Anthropic executes the searches and
  // returns the results inline, so we do NOT hand-craft tool_result blocks.
  // We only need to keep resuming the turn while the model reports `pause_turn`
  // (its signal that an agentic search run isn't finished yet).
  const MAX_TURNS = 8
  const seen = new Set<string>()

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (anthropic.beta.messages.create as any)({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: SCOUT_SYSTEM,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages,
      betas: ['web-search-2025-03-05'],
      stream: false,
    }) as Anthropic.Message

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'pause_turn') {
      // The model paused mid-run; resume by sending the conversation back.
      continue
    }

    // Terminal turn — extract the JSON array from the final text.
    for (const block of response.content) {
      if (block.type !== 'text') continue
      const text = block.text.trim()
      const jsonStart = text.indexOf('[')
      const jsonEnd = text.lastIndexOf(']')
      if (jsonStart === -1 || jsonEnd === -1) continue

      try {
        const results = JSON.parse(text.substring(jsonStart, jsonEnd + 1))
        if (!Array.isArray(results)) continue
        for (const raw of results) {
          const result = normalizeScoutResult(raw)
          if (!result) continue
          const key = `${result.business_name.toLowerCase()}|${result.city.toLowerCase()}`
          if (seen.has(key)) continue
          seen.add(key)
          onResult(result)
        }
      } catch {
        // Malformed JSON — skip without crashing the stream.
      }
    }
    return
  }
}

function asNumberOrNull(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function normalizeScoutResult(raw: unknown): ScoutResult | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const business_name = typeof r.business_name === 'string' ? r.business_name.trim() : ''
  if (!business_name) return null

  return {
    business_name,
    address: typeof r.address === 'string' ? r.address : '',
    city: typeof r.city === 'string' && r.city.trim() ? r.city.trim() : '',
    phone: typeof r.phone === 'string' ? r.phone : null,
    google_rating: asNumberOrNull(r.google_rating),
    review_count: asNumberOrNull(r.review_count),
    years_on_map: asNumberOrNull(r.years_on_map),
    has_website: r.has_website === true,
    website_url: typeof r.website_url === 'string' ? r.website_url : null,
    website_age: asNumberOrNull(r.website_age),
    source_url: typeof r.source_url === 'string' ? r.source_url : null,
  }
}
