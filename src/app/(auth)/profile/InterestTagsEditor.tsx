'use client'

import { useState, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { addInterestTag, removeInterestTag, createCustomTag } from '@/app/actions/profile'

type Tag = { id: string; name: string; slug: string; is_predefined: boolean }

export default function InterestTagsEditor({
  predefinedTags,
  initialSelectedIds,
  initialCustomTags,
}: {
  predefinedTags: Tag[]
  initialSelectedIds: string[]
  initialCustomTags: Tag[]
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds))
  const [customTags, setCustomTags] = useState<Tag[]>(initialCustomTags)
  const [newTag, setNewTag] = useState('')
  const [pending, setPending] = useState<string | null>(null) // tag id or 'new'
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function togglePredefined(tag: Tag) {
    if (pending) return
    setError(null)
    const wasSelected = selectedIds.has(tag.id)

    // Optimistic
    setSelectedIds((prev) => {
      const next = new Set(prev)
      wasSelected ? next.delete(tag.id) : next.add(tag.id)
      return next
    })

    setPending(tag.id)
    const result = wasSelected
      ? await removeInterestTag(tag.id)
      : await addInterestTag(tag.id)
    setPending(null)

    if (result.error) {
      setError(result.error)
      // Revert
      setSelectedIds((prev) => {
        const next = new Set(prev)
        wasSelected ? next.add(tag.id) : next.delete(tag.id)
        return next
      })
    }
  }

  async function handleRemoveCustom(tag: Tag) {
    if (pending) return
    setError(null)

    // Optimistic
    setCustomTags((prev) => prev.filter((t) => t.id !== tag.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(tag.id)
      return next
    })

    setPending(tag.id)
    const result = await removeInterestTag(tag.id)
    setPending(null)

    if (result.error) {
      setError(result.error)
      setCustomTags((prev) => [...prev, tag])
      setSelectedIds((prev) => new Set([...prev, tag.id]))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newTag.trim()
    if (!name || pending) return
    setError(null)

    setPending('new')
    const result = await createCustomTag(name)
    setPending(null)

    if (result.error) {
      setError(result.error)
    } else if (result.tag) {
      setCustomTags((prev) => [...prev, result.tag!])
      setSelectedIds((prev) => new Set([...prev, result.tag!.id]))
      setNewTag('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="space-y-5">
      {/* Predefined tags */}
      <div>
        <p className="mb-2 text-xs text-slate-500">Select interests</p>
        <div className="flex flex-wrap gap-2">
          {predefinedTags.map((tag) => {
            const isSelected = selectedIds.has(tag.id)
            const isLoading = pending === tag.id
            return (
              <button
                key={tag.id}
                onClick={() => togglePredefined(tag)}
                disabled={!!pending}
                className={[
                  'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300',
                  isLoading ? 'opacity-50' : '',
                  pending && pending !== tag.id ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom tags */}
      {customTags.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-slate-500">Your custom tags</p>
          <div className="flex flex-wrap gap-2">
            {customTags.map((tag) => (
              <span
                key={tag.id}
                className="flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 pl-3 pr-2 py-1 text-sm text-purple-300"
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveCustom(tag)}
                  disabled={!!pending}
                  className="rounded-full p-0.5 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                  title="Remove tag"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Create custom tag */}
      <form onSubmit={handleCreate} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add a custom tag…"
          maxLength={30}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!newTag.trim() || !!pending}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          {pending === 'new' ? 'Adding…' : 'Add'}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
