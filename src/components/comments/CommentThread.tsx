import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MessageSquare } from 'lucide-react'
import CommentItem, { type CommentData } from './CommentItem'
import CommentInput from './CommentInput'
import CommentFilters from './CommentFilters'
import Link from 'next/link'

type Sort = 'latest' | 'most_engaged'

type RawComment = {
  id: string
  body: string
  created_at: string
  stance_context: 'support' | 'oppose' | 'neutral' | null
  parent_comment_id: string | null
  user_profiles: { username: string; display_name: string } | null
  comment_votes: { vote: number; user_id: string }[]
}

export default async function CommentThread({
  legislationId,
  sort = 'latest',
}: {
  legislationId: string
  sort?: Sort
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: raw } = await supabase
    .from('comments')
    .select(`
      id,
      body,
      created_at,
      stance_context,
      parent_comment_id,
      user_profiles(username, display_name),
      comment_votes(vote, user_id)
    `)
    .eq('legislation_id', legislationId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })

  const rows = (raw ?? []) as unknown as RawComment[]

  // Build enriched comment objects
  const enriched: (CommentData & { parent_comment_id: string | null; engagement: number })[] =
    rows.map((r) => {
      const votes = r.comment_votes ?? []
      const voteScore = votes.reduce((sum, v) => sum + v.vote, 0)
      const userVoteRow = user ? votes.find((v) => v.user_id === user.id) : null
      const profile = Array.isArray(r.user_profiles) ? r.user_profiles[0] : r.user_profiles

      return {
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        stance_context: r.stance_context,
        parent_comment_id: r.parent_comment_id,
        vote_score: voteScore,
        user_vote: userVoteRow ? (userVoteRow.vote as 1 | -1) : null,
        engagement: votes.length,
        author: {
          username: profile?.username ?? 'unknown',
          display_name: profile?.display_name ?? 'Unknown User',
        },
        replies: [],
      }
    })

  // Build comment tree (one level deep)
  const byId = new Map(enriched.map((c) => [c.id, c]))
  const topLevel: typeof enriched = []

  for (const c of enriched) {
    if (!c.parent_comment_id) {
      topLevel.push(c)
    } else {
      const parent = byId.get(c.parent_comment_id)
      if (parent) parent.replies.push(c)
    }
  }

  // Sort replies newest first
  for (const c of topLevel) {
    c.replies.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  // Sort top-level
  if (sort === 'most_engaged') {
    topLevel.sort((a, b) => b.engagement - a.engagement)
  } else {
    topLevel.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  return (
    <section id="comments" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          <MessageSquare size={14} />
          Discussion
          {topLevel.length > 0 && (
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs normal-case text-slate-300">
              {rows.length}
            </span>
          )}
        </h2>
        {rows.length > 1 && <CommentFilters currentSort={sort} />}
      </div>

      {/* Input or sign-in prompt */}
      {user ? (
        <CommentInput legislationId={legislationId} />
      ) : (
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-400">
          <Link href="/login" className="text-indigo-400 hover:underline">
            Sign in
          </Link>{' '}
          to join the discussion.
        </div>
      )}

      {/* Comments */}
      {topLevel.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-600">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-5">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              legislationId={legislationId}
              isLoggedIn={!!user}
            />
          ))}
        </div>
      )}
    </section>
  )
}
