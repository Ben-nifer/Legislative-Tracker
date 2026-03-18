'use client'

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { followTopic, unfollowTopic } from '@/app/actions/social'

export default function FollowTopicButton({
  topicId,
  topicName,
  initialFollowing,
  isLoggedIn,
}: {
  topicId: string
  topicName: string
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
      ? await followTopic(topicId)
      : await unfollowTopic(topicId)

    setPending(false)
    if (result.error) setFollowing(!next)
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isLoggedIn || pending}
      title={isLoggedIn ? undefined : 'Sign in to follow topics'}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50',
        following
          ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
          : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200',
      ].join(' ')}
    >
      {following ? <Check size={12} /> : <Plus size={12} />}
      {topicName}
    </button>
  )
}
