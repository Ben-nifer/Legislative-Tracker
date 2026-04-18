import { NextResponse } from 'next/server'
import { syncCouncilMembers, syncCommitteeMemberships } from '@/lib/legistar/sync'

export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const membersSynced = await syncCouncilMembers()
    const memberships = await syncCommitteeMemberships()
    return NextResponse.json({ success: true, membersSynced, ...memberships })
  } catch (error) {
    console.error('Council sync failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Council sync failed' },
      { status: 500 }
    )
  }
}
