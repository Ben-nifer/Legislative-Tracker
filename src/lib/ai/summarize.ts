import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const LEGISTAR_BASE = 'https://webapi.legistar.com/v1/nyc'
const LEGISTAR_TOKEN = process.env.LEGISTAR_API_TOKEN

/**
 * Fetches the plain-text bill text from Legistar for a given matter ID.
 * Returns null if unavailable.
 */
async function fetchBillText(legistarMatterId: string): Promise<string | null> {
  if (!LEGISTAR_TOKEN) return null
  try {
    const url = `${LEGISTAR_BASE}/matters/${legistarMatterId}/texts?token=${LEGISTAR_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) return null
    const texts = await res.json()
    if (!Array.isArray(texts) || texts.length === 0) return null
    // Prefer the most recent version
    const latest = texts[texts.length - 1]
    return latest.MatterTextPlain || latest.MatterTextRtf || null
  } catch {
    return null
  }
}

/**
 * Generates a plain-language AI summary of a piece of legislation.
 * Returns null if the Claude API is not configured or the call fails.
 */
export async function generateSummary(
  title: string,
  billText: string | null
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const content = billText
    ? `Title: ${title}\n\nBill text:\n${billText.slice(0, 8000)}`
    : `Title: ${title}\n\n(No full bill text available — summarize based on the title only.)`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are summarizing NYC Council legislation for everyday New Yorkers.

${content}

Write a plain-language summary in 2–3 sentences that explains:
1. What this legislation does
2. Who it affects
3. Why it matters

Keep it accessible and non-partisan. Do not use jargon or legalese. Write in present tense.`,
        },
      ],
    })

    const block = message.content[0]
    return block.type === 'text' ? block.text.trim() : null
  } catch {
    return null
  }
}

/**
 * Generates a summary for a legislation record, fetching bill text from Legistar if possible.
 * Pass the legistar_url stored in the legislation table.
 */
export async function summarizeLegislation(
  title: string,
  legistarUrl: string | null
): Promise<string | null> {
  let billText: string | null = null

  if (legistarUrl) {
    try {
      const matterId = new URL(legistarUrl).searchParams.get('ID')
      if (matterId) billText = await fetchBillText(matterId)
    } catch {
      // URL parse failed — proceed without bill text
    }
  }

  return generateSummary(title, billText)
}
