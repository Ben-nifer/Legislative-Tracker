'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/actions/profile'

type Profile = {
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
}

export default function ProfileEditor({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const result = await updateProfile({ display_name: displayName, bio: bio || null })

    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700 p-6">
      <h2 className="text-base font-semibold text-white mb-4">Edit profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm text-slate-300 mb-1.5">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={50}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm text-slate-300 mb-1.5">
            Bio <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others a bit about yourself..."
            rows={3}
            maxLength={200}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
          />
          <p className="text-xs text-slate-600 mt-1 text-right">{bio.length}/200</p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving || !displayName}
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-400">Saved</span>
          )}
        </div>
      </form>
    </div>
  )
}
