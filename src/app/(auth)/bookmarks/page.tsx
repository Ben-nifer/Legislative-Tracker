import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LegislationCard, { type LegislationCardData } from '@/components/legislation/LegislationCard'
import { Bookmark } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Bookmarks | NYC Legislative Tracker',
}

export const revalidate = 60

export default async function BookmarksPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/bookmarks')

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      created_at,
      legislation:legislation(
        id,
        file_number,
        slug,
        title,
        status,
        type,
        intro_date,
        last_action_date,
        ai_summary,
        official_summary,
        stats:legislation_stats(
          support_count,
          oppose_count,
          neutral_count,
          watching_count,
          comment_count,
          bookmark_count
        ),
        sponsorships(
          is_primary,
          legislator:legislators(full_name, slug)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) console.error('Bookmarks fetch error:', error.message)

  const items: LegislationCardData[] = (data ?? []).flatMap((row) => {
    const leg = Array.isArray(row.legislation) ? row.legislation[0] : row.legislation
    if (!leg) return []

    const primarySponsorship = (leg.sponsorships ?? []).find((s) => s.is_primary)
    const primaryLegislator = primarySponsorship
      ? Array.isArray(primarySponsorship.legislator)
        ? primarySponsorship.legislator[0]
        : primarySponsorship.legislator
      : null

    const statsRow = Array.isArray(leg.stats) ? leg.stats[0] : leg.stats

    return [{
      id: leg.id,
      file_number: leg.file_number,
      slug: leg.slug,
      title: leg.title,
      status: leg.status,
      type: leg.type,
      intro_date: leg.intro_date,
      last_action_date: leg.last_action_date,
      ai_summary: leg.ai_summary,
      official_summary: leg.official_summary,
      stats: statsRow ? {
        support_count: statsRow.support_count ?? 0,
        oppose_count: statsRow.oppose_count ?? 0,
        neutral_count: statsRow.neutral_count ?? 0,
        watching_count: statsRow.watching_count ?? 0,
        comment_count: statsRow.comment_count ?? 0,
        bookmark_count: statsRow.bookmark_count ?? 0,
      } : null,
      primary_sponsor: primaryLegislator?.full_name ?? null,
      primary_sponsor_slug: primaryLegislator?.slug ?? null,
    }]
  })

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <Bookmark className="text-indigo-400" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Bookmarks</h1>
              <p className="mt-0.5 text-sm text-slate-400">Legislation you&apos;ve saved</p>
            </div>
          </div>
          {items.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bookmark className="mb-4 text-slate-700" size={48} />
            <h2 className="mb-2 text-lg font-semibold text-slate-400">No bookmarks yet</h2>
            <p className="mb-4 max-w-sm text-sm text-slate-600">
              Save legislation to find it again easily. Look for the bookmark icon on any bill.
            </p>
            <Link
              href="/legislation"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Browse legislation
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <LegislationCard key={item.id} legislation={item} initialBookmarked={true} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
