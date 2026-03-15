'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { voteComment } from '@/app/actions/comments'

export default function VoteButtons({
  commentId,
  initialScore,
  initialUserVote,
  isLoggedIn,
}: {
  commentId: string
  initialScore: number
  initialUserVote: 1 | -1 | null
  isLoggedIn: boolean
}) {
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState<1 | -1 | null>(initialUserVote)
  const [pending, setPending] = useState(false)

  async function handleVote(v: 1 | -1) {
    if (!isLoggedIn || pending) return

    const prev = userVote
    const prevScore = score

    // Toggle off if same vote, otherwise switch
    const next: 1 | -1 | 0 = prev === v ? 0 : v
    setUserVote(next === 0 ? null : next)
    setScore(prevScore + (next === 0 ? -prev! : next - (prev ?? 0)))

    setPending(true)
    const result = await voteComment(commentId, next)
    setPending(false)

    if (result.error) {
      setUserVote(prev)
      setScore(prevScore)
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => handleVote(1)}
        disabled={!isLoggedIn || pending}
        title={isLoggedIn ? 'Upvote' : 'Sign in to vote'}
        className={[
          'rounded p-0.5 transition-colors',
          !isLoggedIn || pending
            ? 'cursor-not-allowed text-slate-700'
            : userVote === 1
              ? 'text-indigo-400'
              : 'text-slate-500 hover:text-slate-300',
        ].join(' ')}
      >
        <ChevronUp size={16} />
      </button>

      <span
        className={[
          'min-w-[1.5rem] text-center text-xs font-medium tabular-nums',
          score > 0 ? 'text-indigo-400' : score < 0 ? 'text-red-400' : 'text-slate-500',
        ].join(' ')}
      >
        {score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={!isLoggedIn || pending}
        title={isLoggedIn ? 'Downvote' : 'Sign in to vote'}
        className={[
          'rounded p-0.5 transition-colors',
          !isLoggedIn || pending
            ? 'cursor-not-allowed text-slate-700'
            : userVote === -1
              ? 'text-red-400'
              : 'text-slate-500 hover:text-slate-300',
        ].join(' ')}
      >
        <ChevronDown size={16} />
      </button>
    </div>
  )
}
