'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Flag } from 'lucide-react'
import VoteButtons from './VoteButtons'
import CommentInput from './CommentInput'
import { reportComment } from '@/app/actions/comments'

export type CommentData = {
  id: string
  body: string
  created_at: string
  stance_context: 'support' | 'oppose' | 'neutral' | null
  vote_score: number
  user_vote: 1 | -1 | null
  author: {
    username: string
    display_name: string
  }
  replies: CommentData[]
}

const STANCE_STYLE = {
  support: 'bg-emerald-500/20 text-emerald-300',
  oppose: 'bg-red-500/20 text-red-300',
  neutral: 'bg-amber-500/20 text-amber-300',
}

export default function CommentItem({
  comment,
  legislationId,
  isLoggedIn,
  depth = 0,
}: {
  comment: CommentData
  legislationId: string
  isLoggedIn: boolean
  depth?: number
}) {
  const [showReply, setShowReply] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const [reported, setReported] = useState(false)

  async function handleReport() {
    if (reported) return
    await reportComment(comment.id)
    setReported(true)
  }

  const initials = comment.author.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={depth > 0 ? 'ml-8 border-l border-slate-700/60 pl-4' : ''}>
      <div className="group">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          {/* Avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-300">
            {initials}
          </div>

          <span className="text-sm font-medium text-slate-200">
            {comment.author.display_name}
          </span>
          <span className="text-xs text-slate-600">@{comment.author.username}</span>

          {comment.stance_context && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${STANCE_STYLE[comment.stance_context]}`}>
              {comment.stance_context}
            </span>
          )}

          <span className="ml-auto text-xs text-slate-600">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Body */}
        <div className="ml-9">
          <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
            {comment.body}
          </p>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-4">
            <VoteButtons
              commentId={comment.id}
              initialScore={comment.vote_score}
              initialUserVote={comment.user_vote}
              isLoggedIn={isLoggedIn}
            />

            {depth === 0 && isLoggedIn && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showReply ? 'Cancel' : 'Reply'}
              </button>
            )}

            {depth === 0 && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showReplies
                  ? `Hide ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                  : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
              </button>
            )}

            {!reported ? (
              <button
                onClick={handleReport}
                className="ml-auto text-xs text-slate-700 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-500 flex items-center gap-1"
              >
                <Flag size={11} /> Report
              </button>
            ) : (
              <span className="ml-auto text-xs text-slate-600">Reported</span>
            )}
          </div>

          {/* Reply input */}
          {showReply && (
            <div className="mt-3">
              <CommentInput
                legislationId={legislationId}
                parentCommentId={comment.id}
                placeholder="Write a reply..."
                onSuccess={() => setShowReply(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3 ml-9">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              legislationId={legislationId}
              isLoggedIn={isLoggedIn}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
