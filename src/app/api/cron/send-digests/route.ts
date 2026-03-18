import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendDigestEmail, type DigestItem } from '@/lib/email/send'

export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // 1. Find all users who have opted into email digests
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, display_name, email_digests_enabled')
    .eq('email_digests_enabled', true)

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: 'No digest subscribers' })
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  let sent = 0
  let failed = 0

  for (const profile of profiles) {
    // 2. Get their followed legislation with recent activity
    const { data: follows } = await supabase
      .from('legislation_follows')
      .select(`
        legislation:legislation(
          file_number,
          slug,
          title,
          status,
          last_action_date,
          last_action_text
        )
      `)
      .eq('user_id', profile.id)
      .eq('notify_updates', true)

    // Filter to items updated in the last 24h
    const recentItems: DigestItem[] = (follows ?? [])
      .flatMap((f) => {
        const leg = Array.isArray(f.legislation) ? f.legislation[0] : f.legislation
        if (!leg) return []
        if (!leg.last_action_date || leg.last_action_date < cutoff) return []
        return [{
          file_number: leg.file_number,
          title: leg.title,
          status: leg.status,
          slug: leg.slug,
          last_action_text: leg.last_action_text ?? null,
          last_action_date: leg.last_action_date ?? null,
        }]
      })

    // Skip users with no recent activity on followed items
    if (recentItems.length === 0) continue

    // 3. Get their email from auth.users via service client
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
    const email = authUser?.user?.email
    if (!email) continue

    // 4. Send the digest
    const { error } = await sendDigestEmail({
      to: email,
      displayName: profile.display_name,
      items: recentItems,
    })

    if (error) {
      console.error(`Failed to send digest to ${email}:`, error)
      failed++
    } else {
      sent++
    }
  }

  return NextResponse.json({ success: true, sent, failed })
}
