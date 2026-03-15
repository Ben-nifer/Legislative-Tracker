export type ModerationResult = {
  flagged: boolean
  categories: string[]
}

/**
 * Checks text against OpenAI's free moderation API.
 * Fails open — if the API is unavailable or unconfigured, the content is allowed.
 */
export async function checkModeration(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { flagged: false, categories: [] }

  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
    })

    if (!res.ok) return { flagged: false, categories: [] }

    const data = await res.json()
    const result = data.results?.[0]
    if (!result) return { flagged: false, categories: [] }

    const flaggedCategories = Object.entries(result.categories ?? {})
      .filter(([, value]) => value === true)
      .map(([key]) => key)

    return { flagged: result.flagged ?? false, categories: flaggedCategories }
  } catch {
    // Never block a post due to a moderation API failure
    return { flagged: false, categories: [] }
  }
}
