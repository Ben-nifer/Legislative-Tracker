import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ArrowRight, FileText, Users, TrendingUp, MessageSquare } from 'lucide-react'
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

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()

  const [
    { count: totalLegislation },
    { count: totalLegislators },
    { count: totalStances },
    { data: recent },
    { data: trending },
  ] = await Promise.all([
    supabase.from('legislation').select('*', { count: 'exact', head: true }),
    supabase.from('legislators').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('user_stances').select('*', { count: 'exact', head: true }),
    supabase
      .from('legislation')
      .select('id, slug, file_number, title, status, type, intro_date, ai_summary')
      .not('type', 'is', null)
      .order('intro_date', { ascending: false })
      .limit(5),
    supabase
      .from('legislation')
      .select(`
        id, slug, file_number, title, status, type,
        stats:legislation_stats(support_count, oppose_count, neutral_count, comment_count)
      `)
      .not('type', 'is', null)
      .order('intro_date', { ascending: false })
      .limit(5),
  ])

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

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: <FileText size={20} />, value: totalLegislation?.toLocaleString() ?? '—', label: 'Bills & Resolutions', color: 'text-indigo-400' },
            { icon: <Users size={20} />, value: totalLegislators?.toLocaleString() ?? '—', label: 'Active Council Members', color: 'text-purple-400' },
            { icon: <TrendingUp size={20} />, value: totalStances?.toLocaleString() ?? '—', label: 'User Stances Taken', color: 'text-emerald-400' },
            { icon: <MessageSquare size={20} />, value: '—', label: 'Comments Posted', color: 'text-amber-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
              <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Two-col: Recent + Trending ───────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">

          {/* Recent introductions */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-200">Recently Introduced</h2>
              <Link href="/legislation" className="text-xs text-indigo-400 hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
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
          </div>

          {/* Most engaged */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-200">Most Engaged</h2>
              <Link href="/legislation" className="text-xs text-indigo-400 hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {(trending ?? []).map((item) => {
                const statsRow = Array.isArray(item.stats) ? item.stats[0] : item.stats
                const total = (statsRow?.support_count ?? 0) + (statsRow?.oppose_count ?? 0) + (statsRow?.neutral_count ?? 0)
                return (
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
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-300">{item.title}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                      <span className="text-emerald-500/80">{statsRow?.support_count ?? 0} support</span>
                      <span className="text-red-500/80">{statsRow?.oppose_count ?? 0} oppose</span>
                      <span className="text-slate-500">{statsRow?.comment_count ?? 0} comments</span>
                      {total > 0 && <span className="ml-auto">{total} responses</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
