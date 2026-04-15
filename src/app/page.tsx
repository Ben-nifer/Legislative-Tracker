import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ArrowRight, TrendingUp, Rss } from 'lucide-react'
import { format } from 'date-fns'

export const revalidate = 300

function getStatusStyle(status: string) {
  const s = status.toLowerCase()
  if (s.includes('enact') || s.includes('adopt') || s.includes('pass'))
    return 'bg-emerald-500/20 text-emerald-300'
  if (s.includes('veto') || s.includes('fail') || s.includes('withdrawn'))
    return 'bg-red-500/20 text-red-300'
  if (s.includes('hearing'))
    return 'bg-blue-500/20 text-blue-300'
  return 'bg-amber-500/20 text-amber-300'
}

type FeedItem = {
  id: string
  slug: string
  file_number: string
  title: string
  status: string
  type: string | null
  intro_date: string | null
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: totalLegislation },
    { data: recent },
    { data: trending },
    { data: legislatorFollowsData },
    { data: userFollowsData },
  ] = await Promise.all([
    supabase.from('legislation').select('*', { count: 'exact', head: true }),
    supabase
      .from('legislation')
      .select('id, slug, file_number, title, status, type, intro_date, ai_summary')
      .eq('type', 'introduction')
      .order('intro_date', { ascending: false })
      .limit(5),
    supabase
      .from('legislation_stats')
      .select(`
        support_count, oppose_count, neutral_count, comment_count, trending_score,
        legislation!inner(id, slug, file_number, title, status, type)
      `)
      .not('trending_score', 'is', null)
      .order('trending_score', { ascending: false })
      .limit(10),
    user
      ? supabase.from('legislator_follows').select('legislator_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] as { legislator_id: string }[], error: null }),
    user
      ? supabase.from('user_follows').select('following_id').eq('follower_id', user.id)
      : Promise.resolve({ data: [] as { following_id: string }[], error: null }),
  ])

  const followedLegislatorIds = (legislatorFollowsData ?? []).map((f) => f.legislator_id)
  const followedUserIds = (userFollowsData ?? []).map((f) => f.following_id)
  const hasFollows = followedLegislatorIds.length > 0 || followedUserIds.length > 0

  // Phase 2: feed queries — only if user follows someone
  const [sponsorshipsResult, stancesResult] = await Promise.all([
    followedLegislatorIds.length > 0
      ? supabase
          .from('sponsorships')
          .select('legislator_id, legislation:legislation(id, slug, file_number, title, status, type, intro_date)')
          .in('legislator_id', followedLegislatorIds)
          .order('legislation(intro_date)', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] as { legislator_id: string; legislation: FeedItem | FeedItem[] | null }[], error: null }),
    followedUserIds.length > 0
      ? supabase
          .from('user_stances')
          .select('legislation:legislation(id, slug, file_number, title, status, type, intro_date)')
          .in('user_id', followedUserIds)
          .order('updated_at', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] as { legislation: FeedItem | FeedItem[] | null }[], error: null }),
  ])

  // Deduplicate and merge both feeds (introductions only)
  const seen = new Set<string>()
  const legislatorItems: FeedItem[] = (sponsorshipsResult.data ?? []).flatMap((s) => {
    const leg = Array.isArray(s.legislation) ? s.legislation[0] : s.legislation
    if (!leg || seen.has(leg.id) || leg.type !== 'introduction') return []
    seen.add(leg.id)
    return [leg]
  })

  const stanceItems: FeedItem[] = (stancesResult.data ?? []).flatMap((s) => {
    const leg = Array.isArray(s.legislation) ? s.legislation[0] : s.legislation
    if (!leg || seen.has(leg.id) || leg.type !== 'introduction') return []
    seen.add(leg.id)
    return [leg]
  })

  const feedItems = [...legislatorItems, ...stanceItems].slice(0, 6)

  // Filter trending to introductions only
  const trendingIntroductions = (trending ?? []).filter((row) => {
    const leg = Array.isArray(row.legislation) ? row.legislation[0] : row.legislation
    return leg?.type === 'introduction'
  }).slice(0, 5)

  return (
    <main className="min-h-screen bg-slate-950">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            NYC Council · {totalLegislation?.toLocaleString() ?? '—'} items tracked
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            NYC legislation,{' '}
            <span className="text-indigo-400">made accessible</span>
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Browse, understand, and engage with New York City Council bills and
            resolutions. Track what matters to your neighborhood.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/legislation"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
            >
              Browse Legislation <ArrowRight size={16} />
            </Link>
            <Link
              href="/council-members"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-700"
            >
              Council Members
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trending ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-200">Trending</h2>
          </div>
          <Link href="/trending" className="text-xs text-indigo-400 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trendingIntroductions.map((row) => {
            const leg = Array.isArray(row.legislation) ? row.legislation[0] : row.legislation
            if (!leg) return null
            const total = (row.support_count ?? 0) + (row.oppose_count ?? 0) + (row.neutral_count ?? 0)
            return (
              <Link
                key={leg.id}
                href={`/legislation/${leg.slug}`}
                className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusStyle(leg.status)}`}>
                    {leg.status}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{leg.file_number}</span>
                </div>
                <p className="line-clamp-2 text-sm text-slate-300">{leg.title}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                  <span className="text-emerald-500/80">{row.support_count ?? 0} support</span>
                  <span className="text-red-500/80">{row.oppose_count ?? 0} oppose</span>
                  <span className="text-slate-500">{row.comment_count ?? 0} comments</span>
                  {total > 0 && <span className="ml-auto">{total} responses</span>}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── New from people you follow ───────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2">
          <Rss size={16} className="text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-200">New from people you follow</h2>
        </div>

        {!user ? (
          // Not logged in — sign-in prompt
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
            <p className="text-sm text-slate-400">
              <Link href="/login" className="text-indigo-400 hover:underline">Sign in</Link>
              {' '}to track legislation and follow council members.
            </p>
          </div>
        ) : !hasFollows ? (
          // Logged in, follows nobody yet
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
            <p className="text-sm text-slate-400">Follow council members to see their legislation here.</p>
            <div className="mt-3 flex items-center justify-center gap-4 text-sm">
              <Link href="/council-members" className="text-indigo-400 hover:underline">Browse council members</Link>
              <span className="text-slate-700">·</span>
              <Link href="/following" className="text-indigo-400 hover:underline">Manage following</Link>
            </div>
          </div>
        ) : feedItems.length === 0 ? (
          // Follows someone but no legislation yet
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
            <p className="text-sm text-slate-500">No recent legislation from the people you follow.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {feedItems.map((item) => (
              <Link
                key={item.id}
                href={`/legislation/${item.slug}`}
                className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusStyle(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{item.file_number}</span>
                  {item.intro_date && (
                    <span className="ml-auto text-xs text-slate-600">
                      {format(new Date(item.intro_date), 'MMM d')}
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm text-slate-300">{item.title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Recently Introduced ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200">Recently Introduced</h2>
          <Link href="/legislation" className="text-xs text-indigo-400 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(recent ?? []).map((item) => (
            <Link
              key={item.id}
              href={`/legislation/${item.slug}`}
              className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusStyle(item.status)}`}>
                  {item.status}
                </span>
                <span className="font-mono text-xs text-slate-500">{item.file_number}</span>
                {item.intro_date && (
                  <span className="ml-auto text-xs text-slate-600">
                    {format(new Date(item.intro_date), 'MMM d')}
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-sm text-slate-300">{item.title}</p>
              {item.ai_summary && (
                <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{item.ai_summary}</p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
