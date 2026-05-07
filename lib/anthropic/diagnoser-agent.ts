import { anthropic } from './client'
import type { DiagnosisInput, Diagnosis } from '@/types/diagnosis'

const DIAGNOSER_SYSTEM = `You are a digital marketing analyst specializing in small local businesses.
Given information about a business, write a precise diagnosis of their digital presence gap
and craft a compelling outreach angle.
Respond with ONLY a valid JSON object — no markdown, no explanation.`

export async function runDiagnoserAgent(
  input: DiagnosisInput
): Promise<Omit<Diagnosis, 'id' | 'lead_id' | 'created_at'>> {
  const prompt = `Analyze this business and return a JSON diagnosis:

Business: ${input.business_name}
Type: ${input.niche}
Location: ${input.city}
Website: ${input.has_website ? (input.website_url ?? 'Yes (URL unknown)') : 'NONE'}
Google Rating: ${input.google_rating ?? 'unknown'} (${input.review_count ?? '?'} reviews)

Return this exact JSON shape:
{
  "summary": "<50-word plain-English diagnosis of their digital presence gap>",
  "hero_angle": "<the single strongest selling point to open with, e.g. '22 years in business, zero online presence'>",
  "tone": "<one of: friendly-direct | professional | casual | urgent>",
  "gap_score": <integer 1-10 where 10 = completely invisible online>,
  "suggested_message": "<a 3-4 sentence cold outreach message in Swedish, personalised using the hero angle, referencing their actual business name and niche>"
}

Rules:
- gap_score 8-10: no website at all
- gap_score 5-7: outdated website (pre-2020) or no social presence
- gap_score 1-4: has modern website but missing SEO / local listings
- suggested_message MUST be in Swedish
- hero_angle must reference something specific (years, rating, niche specialisation)
- Do NOT use AI buzzwords like "revolutionize", "leverage", "synergy"`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: DIAGNOSER_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Diagnoser returned invalid JSON')
  }

  const parsed = JSON.parse(text.substring(jsonStart, jsonEnd + 1))

  return {
    summary: parsed.summary,
    hero_angle: parsed.hero_angle,
    tone: parsed.tone,
    gap_score: Math.min(10, Math.max(1, parseInt(parsed.gap_score))),
    suggested_message: parsed.suggested_message,
    raw_claude_json: parsed,
  }
}
