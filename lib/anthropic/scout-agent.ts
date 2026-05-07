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

  let continueLoop = true

  while (continueLoop) {
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

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: 'Search completed. Please extract business information from the results.',
          })
        }
      }

      messages.push({ role: 'user', content: toolResults })
    } else {
      continueLoop = false

      for (const block of response.content) {
        if (block.type === 'text') {
          try {
            const text = block.text.trim()
            const jsonStart = text.indexOf('[')
            const jsonEnd = text.lastIndexOf(']')
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const jsonStr = text.substring(jsonStart, jsonEnd + 1)
              const results = JSON.parse(jsonStr) as ScoutResult[]
              for (const result of results) {
                onResult(result)
              }
            }
          } catch {
            // If parsing fails, continue without crashing
          }
        }
      }
    }
  }
}
