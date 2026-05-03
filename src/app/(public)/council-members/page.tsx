import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, MapPin, Mail, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react'
import MemberAvatar from '@/components/council/MemberAvatar'

export const metadata = {
  title: 'Council Members | NYC Legislative Tracker',
  description: 'Browse current New York City Council members.',
}

export const revalidate = 3600

const BOROUGH_ORDER = ['Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island']

type SortKey = 'most_popular' | 'least_popular' | 'most_engaged'

type Member = {
  id: string
  full_name: string
  slug: string
  title?: string | null
  district?: string | null
  borough?: string | null
  party?: string | null
  email?: string | null
  photo_url?: string | null
}

type MemberStats = {
  support: number
  oppose: number
  neutral: number
  watching: number
  total: number
  popularityRatio: number // support / (support + oppose), 0.5 if no data
}

const SORT_TABS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: 'most_popular', label: 'Most Popular', icon: <ThumbsUp size={13} /> },
  { key: 'most_engaged', label: 'Most Engaged', icon: <TrendingUp size={13} /> },
  { key: 'least_popular', label: 'Least Popular', icon: <ThumbsDown size={13} /> },
]

function MemberCard({
  m,
  stats,
  sort,
}: {
  m: Member
  stats?: MemberStats
  sort?: SortKey
}) {
  return (
    <Link
      href={`/council-members/${m.slug}`}
      className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
    >
      <MemberAvatar name={m.full_name} photoUrl={m.photo_url} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-100 truncate">{m.full_name}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {m.district ? `District ${m.district}` : (m.title ?? 'Council Member')}
          {sort && m.borough ? ` · ${m.borough}` : ''}
        </p>
        {m.party && <p className="text-xs text-slate-600 mt-0.5">{m.party}</p>}

        {/* Stats bar shown when sorted */}
        {sort && stats && stats.total > 0 && (
          <div className="mt-2 flex items-center gap-3 text-xs">
            {(sort === 'most_popular' || sort === 'least_popular') && (
              <>
                <span className="text-emerald-400">{stats.support} support</span>
                <span className="text-red-400">{stats.oppose} oppose</span>
                <span className="ml-auto text-slate-500">
                  {stats.support + stats.oppose > 0
                    ? `${Math.round((stats.support / (stats.support + stats.oppose)) * 100)}% approval`
                    : '—'}
                </span>
              </>
            )}
            {sort === 'most_engaged' && (
              <>
                <span className="text-emerald-400">{stats.support}</span>
                <span className="text-red-400">{stats.oppose}</span>
                <span className="text-amber-400">{stats.neutral}</span>
                <span className="text-blue-400">{stats.watching}</span>
                <span className="ml-auto text-slate-500">{stats.total.toLocaleString()} total</span>
              </>
            )}
          </div>
        )}
      </div>
      {!sort && m.email && (
        <Mail size={14} className="ml-auto shrink-0 text-slate-700" />
      )}
    </Link>
  )
}

export default async function CouncilMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const { sort: rawSort } = await searchParams
  const sort = (rawSort as SortKey) || undefined
  const isSorted = !!sort && SORT_TABS.some((t) => t.key === sort)

  const supabase = await createServerSupabaseClient()

  // Fetch all active members
  const { data: members } = await supabase
    .from('legislators')
    .select('id, full_name, slug, district, borough, party, email, title, photo_url')
    .eq('is_active', true)
    .order('district', { ascending: true })

  const memberList = members ?? []

  // Fetch sponsorship stats when a sort is active — query user_stances directly for live accuracy
  let statsByMember = new Map<string, MemberStats>()

  if (isSorted) {
    const memberIds = memberList.map((m) => m.id)

    // Step 1: get all legislation IDs sponsored by these members
    const { data: sponsorships } = await supabase
      .from('sponsorships')
      .select('legislator_id, legislation_id')
      .in('legislator_id', memberIds)

    const legIds = [...new Set((sponsorships ?? []).map((s) => s.legislation_id))]

    // Step 2: fetch stances and comment counts for those legislation items
    const [{ data: stanceRows }, { data: commentRows }] = await Promise.all([
      legIds.length > 0
        ? supabase.from('user_stances').select('legislation_id, stance').in('legislation_id', legIds)
        : Promise.resolve({ data: [] }),
      legIds.length > 0
        ? supabase.from('comments').select('legislation_id').eq('is_hidden', false).in('legislation_id', legIds)
        : Promise.resolve({ data: [] }),
    ])

    // Build lookup: legislation_id → { stanceCounts, commentCount }
    type LegStats = { support: number; oppose: number; neutral: number; watching: number; comments: number }
    const byLeg = new Map<string, LegStats>()
    for (const { legislation_id, stance } of stanceRows ?? []) {
      if (!byLeg.has(legislation_id)) byLeg.set(legislation_id, { support: 0, oppose: 0, neutral: 0, watching: 0, comments: 0 })
      const s = byLeg.get(legislation_id)!
      if (stance === 'support') s.support++
      else if (stance === 'oppose') s.oppose++
      else if (stance === 'neutral') s.neutral++
      else if (stance === 'watching') s.watching++
    }
    for (const { legislation_id } of commentRows ?? []) {
      if (!byLeg.has(legislation_id)) byLeg.set(legislation_id, { support: 0, oppose: 0, neutral: 0, watching: 0, comments: 0 })
      byLeg.get(legislation_id)!.comments++
    }

    // Step 3: aggregate per legislator
    for (const { legislator_id, legislation_id } of sponsorships ?? []) {
      const leg = byLeg.get(legislation_id)
      if (!leg) continue

      const current = statsByMember.get(legislator_id) ?? { support: 0, oppose: 0, neutral: 0, watching: 0, total: 0, popularityRatio: 0 }
      const support = current.support + leg.support
      const oppose = current.oppose + leg.oppose
      const neutral = current.neutral + leg.neutral
      const watching = current.watching + leg.watching
      const total = current.total + leg.support + leg.oppose + leg.neutral + leg.watching + leg.comments
      const popularityRatio = (support + oppose) > 0 ? support / (support + oppose) : 0

      statsByMember.set(legislator_id, { support, oppose, neutral, watching, total, popularityRatio })
    }
  }

  // Sort members
  const sortedMembers = isSorted
    ? [...memberList].sort((a, b) => {
        const sa = statsByMember.get(a.id) ?? { support: 0, oppose: 0, neutral: 0, watching: 0, total: 0, popularityRatio: 0 }
        const sb = statsByMember.get(b.id) ?? { support: 0, oppose: 0, neutral: 0, watching: 0, total: 0, popularityRatio: 0 }
        if (sort === 'most_popular') {
          // Primary: popularity ratio descending; tiebreaker: raw support count descending
          const diff = sb.popularityRatio - sa.popularityRatio
          return diff !== 0 ? diff : sb.support - sa.support
        }
        if (sort === 'least_popular') {
          // Only rank members who have actual oppose data; rest go to bottom
          const aHasData = sa.support + sa.oppose > 0
          const bHasData = sb.support + sb.oppose > 0
          if (aHasData && !bHasData) return -1
          if (!aHasData && bHasData) return 1
          const diff = sa.popularityRatio - sb.popularityRatio
          return diff !== 0 ? diff : sa.oppose - sb.oppose
        }
        if (sort === 'most_engaged') return sb.total - sa.total
        return 0
      })
    : memberList

  // Borough grouping for unsorted view
  const byBorough: Record<string, typeof memberList> = {}
  for (const m of memberList) {
    const borough = m.borough ?? 'Other'
    if (!byBorough[borough]) byBorough[borough] = []
    byBorough[borough]!.push(m)
  }
  const boroughs = BOROUGH_ORDER.filter((b) => byBorough[b])

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <Users className="text-indigo-400" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Council Members</h1>
              <p className="mt-0.5 text-sm text-slate-400">
                {memberList.length} active members of the New York City Council
              </p>
            </div>
          </div>

          {/* Sort tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/council-members"
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                !isSorted
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              By Borough
            </Link>
            {SORT_TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/council-members?sort=${tab.key}`}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  sort === tab.key
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isSorted ? (
          /* Flat sorted list */
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedMembers.map((m, i) => (
              <div key={m.id} className="relative">
                {/* Rank badge */}
                <span className="absolute -left-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                  {i + 1}
                </span>
                <MemberCard m={m} stats={statsByMember.get(m.id)} sort={sort} />
              </div>
            ))}
          </div>
        ) : (
          /* Borough grouped view */
          <div className="space-y-10">
            {boroughs.map((borough) => (
              <section key={borough}>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  <MapPin size={14} /> {borough}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {byBorough[borough]?.map((m) => (
                    <MemberCard key={m.id} m={m} />
                  ))}
                </div>
              </section>
            ))}
            {byBorough['Other'] && (
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Other</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {byBorough['Other'].map((m) => (
                    <MemberCard key={m.id} m={m} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
