import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, MapPin, Mail } from 'lucide-react'

export const metadata = {
  title: 'Council Members | NYC Legislative Tracker',
  description: 'Browse current New York City Council members.',
}

export const revalidate = 3600

const BOROUGH_ORDER = ['Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island']

export default async function CouncilMembersPage() {
  const supabase = await createServerSupabaseClient()

  const { data: members } = await supabase
    .from('legislators')
    .select('id, full_name, slug, district, borough, party, email, title')
    .eq('is_active', true)
    .order('district', { ascending: true })

  // Group by borough
  const byBorough: Record<string, typeof members> = {}
  for (const m of members ?? []) {
    const borough = m.borough ?? 'Other'
    if (!byBorough[borough]) byBorough[borough] = []
    byBorough[borough]!.push(m)
  }

  const boroughs = BOROUGH_ORDER.filter((b) => byBorough[b])

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center gap-3">
          <Users className="text-indigo-400" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Council Members</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {members?.length ?? 0} active members of the New York City Council
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        {boroughs.map((borough) => (
          <section key={borough}>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <MapPin size={14} /> {borough}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byBorough[borough]?.map((m) => (
                <Link
                  key={m.id}
                  href={`/council-members/${m.slug}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
                    {m.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100 truncate">{m.full_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {m.title ?? 'Council Member'}
                      {m.district ? ` · District ${m.district}` : ''}
                    </p>
                    {m.party && (
                      <p className="text-xs text-slate-600 mt-0.5">{m.party}</p>
                    )}
                  </div>
                  {m.email && (
                    <Mail size={14} className="ml-auto shrink-0 text-slate-700" />
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* Members without a borough */}
        {byBorough['Other'] && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Other
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byBorough['Other'].map((m) => (
                <Link
                  key={m.id}
                  href={`/council-members/${m.slug}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
                    {m.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100 truncate">{m.full_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.title ?? 'Council Member'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
