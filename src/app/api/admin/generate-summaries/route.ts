import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { summarizeLegislation } from '@/lib/ai/summarize'

export const maxDuration = 300

/**
 * POST /api/admin/generate-summaries
 * Generates AI summaries for legislation that doesn't have one yet.
 * Processes in batches of 10 per call to stay within timeout limits.
 * Call repeatedly until done: { remaining: 0 }
 *
 * Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Fetch a batch of legislation without ai_summary, prioritizing most recent
  const { data: batch, error } = await supabase
    .from('legislation')
    .select('id, title, legistar_url')
    .is('ai_summary', null)
    .not('type', 'is', null) // only intros and resolutions
    .order('intro_date', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!batch || batch.length === 0) {
    return NextResponse.json({ done: true, processed: 0, remaining: 0 })
  }

  let processed = 0
  let failed = 0

  for (const item of batch) {
    const summary = await summarizeLegislation(item.title, item.legistar_url)
    if (summary) {
      await supabase
        .from('legislation')
        .update({ ai_summary: summary })
        .eq('id', item.id)
      processed++
    } else {
      // Mark with empty string to skip on future runs
      await supabase
        .from('legislation')
        .update({ ai_summary: '' })
        .eq('id', item.id)
      failed++
    }
  }

  // Count remaining
  const { count: remaining } = await supabase
    .from('legislation')
    .select('*', { count: 'exact', head: true })
    .is('ai_summary', null)
    .not('type', 'is', null)

  return NextResponse.json({ done: false, processed, failed, remaining: remaining ?? 0 })
}
