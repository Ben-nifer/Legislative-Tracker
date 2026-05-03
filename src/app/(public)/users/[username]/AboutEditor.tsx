'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/actions/profile'

export default function AboutEditor({
  initialBio,
  displayName,
  isOwnProfile,
}: {
  initialBio: string | null
  displayName: string
  isOwnProfile: boolean
}) {
  const [bio, setBio] = useState(initialBio ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await updateProfile({ display_name: displayName, bio: bio.trim() || null })
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setIsEditing(false)
    }
  }

  function handleCancel() {
    setBio(initialBio ?? '')
    setError(null)
    setIsEditing(false)
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">About</h2>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others a bit about yourself…"
            rows={3}
            maxLength={200}
            autoFocus
            className="w-full resize-none rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <span className="ml-auto text-xs text-slate-600">{bio.length}/200</span>
          </div>
        </div>
      ) : (
        <div
          onClick={isOwnProfile ? () => setIsEditing(true) : undefined}
          className={isOwnProfile ? 'cursor-text' : undefined}
        >
          {bio ? (
            <p className="text-sm text-slate-300 leading-relaxed">{bio}</p>
          ) : (
            <p className="text-sm italic text-slate-600">
              {isOwnProfile ? 'Click to add a description…' : 'No bio yet.'}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
