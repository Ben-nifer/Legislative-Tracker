import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, MapPin, FileText } from 'lucide-react'
import { format } from 'date-fns'
import FollowButton from '@/components/council/FollowButton'
import MemberAvatar from '@/components/council/MemberAvatar'

export const revalidate = 3600

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('legislators')
    .select('full_name, title')
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return { title: 'Not Found' }
  return { title: `${data.full_name} | NYC Legislative Tracker` }
}

type Bill = { id: string; slug: string; file_number: string; title: string; status: string; intro_date: string | null }

function BillSection({ title, bills }: { title: string; bills: Bill[] }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <FileText size={14} />
        {title}
        {bills.length > 0 && (
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs normal-case text-slate-300">
            {bills.length}
          </span>
        )}
      </h2>
      {bills.length === 0 ? (
        <p className="text-sm italic text-slate-600">None found.</p>
      ) : (
        <div className="space-y-3">
          {bills.map((item) => (
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
                    {format(new Date(item.intro_date), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-sm text-slate-300">{item.title}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default async function CouncilMemberPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('legislators')
    .select(`
      id, full_name, slug, district, borough, party, email, title, is_active, photo_url,
      website_url, neighborhoods, community_boards, caucuses,
      legislator_committee_memberships(is_chair, committee:committees(name, slug))
    `)
    .eq('slug', slug)
    .maybeSingle()

  if (!member) notFound()

  // Check if current user follows this legislator
  const isFollowing = user
    ? !!(await supabase
        .from('legislator_follows')
        .select('legislator_id')
        .match({ user_id: user.id, legislator_id: member.id })
        .maybeSingle()
      ).data
    : false

  // Get their sponsored legislation
  const { data: sponsorships } = await supabase
    .from('sponsorships')
    .select(`
      is_primary,
      legislation(id, slug, file_number, title, status, type, intro_date)
    `)
    .eq('legislator_id', member.id)
    .order('legislation(intro_date)', { ascending: false })
    .limit(60)

  const primaryBills = (sponsorships ?? [])
    .filter((s) => s.is_primary)
    .flatMap((s) => {
      const leg = Array.isArray(s.legislation) ? s.legislation[0] : s.legislation
      return leg ? [leg] : []
    })
    .slice(0, 30)

  const coBills = (sponsorships ?? [])
    .filter((s) => !s.is_primary)
    .flatMap((s) => {
      const leg = Array.isArray(s.legislation) ? s.legislation[0] : s.legislation
      return leg ? [leg] : []
    })
    .slice(0, 30)

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Back nav */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/council-members"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200"
          >
            <ArrowLeft size={14} /> All Council Members
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Profile header */}
        <section className="flex items-start gap-5">
          <MemberAvatar name={member.full_name} photoUrl={member.photo_url} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{member.full_name}</h1>
              {!member.is_active && (
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                  Former Member
                </span>
              )}
            </div>
            <p className="mt-1 text-slate-400">
              {member.title ?? 'Council Member'}
              {member.district ? ` · District ${member.district}` : ''}
              {member.borough ? ` · ${member.borough}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {member.party && (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <MapPin size={13} /> {member.party}
                </span>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-1.5 text-indigo-400 hover:underline"
                >
                  <Mail size={13} /> {member.email}
                </a>
              )}
            </div>
            <div className="mt-3">
              <FollowButton
                legislatorId={member.id}
                initialFollowing={isFollowing}
                isLoggedIn={!!user}
              />
            </div>
          </div>
        </section>

        {/* District & member info */}
        {(() => {
          const memberships = (member.legislator_committee_memberships ?? []) as unknown as {
            is_chair: boolean
            committee: { name: string; slug: string } | null
          }[]
          const committees = memberships
            .filter((m) => m.committee)
            .sort((a, b) => Number(b.is_chair) - Number(a.is_chair))

          const hasAny =
            member.borough || member.party || member.neighborhoods?.length ||
            member.community_boards?.length || member.website_url ||
            committees.length > 0 || member.caucuses?.length

          if (!hasAny) return null

          return (
            <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                District Info
              </h2>
              <dl className="space-y-2.5 text-sm">
                {member.borough && (
                  <div className="flex gap-2">
                    <dt className="w-36 shrink-0 text-slate-500">Borough</dt>
                    <dd className="text-slate-200">{member.borough}</dd>
                  </div>
                )}
                {member.party && (
                  <div className="flex gap-2">
                    <dt className="w-36 shrink-0 text-slate-500">Party</dt>
                    <dd className="text-slate-200">{member.party}</dd>
                  </div>
                )}
                {member.neighborhoods?.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="w-36 shrink-0 text-slate-500">Neighborhoods</dt>
                    <dd className="text-slate-200">{member.neighborhoods.join(', ')}</dd>
                  </div>
                )}
                {member.community_boards?.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="w-36 shrink-0 text-slate-500">Community Boards</dt>
                    <dd className="text-slate-200">{member.community_boards.join(', ')}</dd>
                  </div>
                )}
                {member.website_url && (
                  <div className="flex gap-2">
                    <dt className="w-36 shrink-0 text-slate-500">Website</dt>
                    <dd>
                      <a
                        href={member.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline"
                      >
                        Official Website →
                      </a>
                    </dd>
                  </div>
                )}
                {committees.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="w-36 shrink-0 text-slate-500">Committees</dt>
                    <dd className="space-y-1">
                      {committees.map((m) => (
                        <div key={m.committee!.slug} className="flex items-center gap-2">
                          <span className="text-slate-200">{m.committee!.name}</span>
                          {m.is_chair && (
                            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                              Chair
                            </span>
                          )}
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
                {member.caucuses?.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="w-36 shrink-0 text-slate-500">Caucuses</dt>
                    <dd className="text-slate-200">{member.caucuses.join(', ')}</dd>
                  </div>
                )}
              </dl>
            </section>
          )
        })()}

        {/* Primary sponsored legislation */}
        <BillSection title="Primary Sponsor" bills={primaryBills} />

        {/* Co-sponsored legislation */}
        <BillSection title="Co-Sponsored" bills={coBills} />
      </div>
    </main>
  )
}
