'use client'

import { useState } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { followLegislator, unfollowLegislator } from '@/app/actions/social'

export default function FollowButton({
  legislatorId,
  initialFollowing,
  isLoggedIn,
}: {
  legislatorId: string
  initialFollowing: boolean
  isLoggedIn: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (!isLoggedIn || pending) return

    const next = !following
    setFollowing(next)
    setPending(true)

    const result = next
      ? await followLegislator(legislatorId)
      : await unfollowLegislator(legislatorId)

    setPending(false)
    if (result.error) setFollowing(!next) // revert on error
  }

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
      >
        <UserPlus size={15} /> Follow
      </a>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={[
        'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60',
        following
          ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300'
          : 'border-slate-700 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300',
      ].join(' ')}
    >
      {following ? (
        <><UserCheck size={15} /> Following</>
      ) : (
        <><UserPlus size={15} /> Follow</>
      )}
    </button>
  )
}
