'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateLegislationNotifySettings, unfollowLegislation } from '@/app/actions/social'

type Props = {
  legislationId: string
  slug: string
  file_number: string
  title: string
  status: string
  notifyUpdates: boolean
  notifyHearings: boolean
  notifyAmendments: boolean
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (val: boolean) => void
  disabled: boolean
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={[
        'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        checked
          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
          : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400',
        disabled ? 'opacity-50 cursor-wait' : '',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function statusStyle(status: string) {
  const s = status.toLowerCase()
  if (s.includes('enact') || s.includes('adopt') || s.includes('pass'))
    return 'bg-emerald-500/20 text-emerald-300'
  if (s.includes('veto') || s.includes('fail') || s.includes('withdrawn'))
    return 'bg-red-500/20 text-red-300'
  if (s.includes('hearing')) return 'bg-blue-500/20 text-blue-300'
  return 'bg-amber-500/20 text-amber-300'
}

export default function LegislationFollowRow({
  legislationId,
  slug,
  file_number,
  title,
  status,
  notifyUpdates,
  notifyHearings,
  notifyAmendments,
}: Props) {
  const [settings, setSettings] = useState({
    notify_updates: notifyUpdates,
    notify_hearings: notifyHearings,
    notify_amendments: notifyAmendments,
  })
  const [saving, setSaving] = useState(false)
  const [removed, setRemoved] = useState(false)

  async function toggle(key: keyof typeof settings) {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    setSaving(true)
    const result = await updateLegislationNotifySettings(legislationId, { [key]: next[key] })
    setSaving(false)
    if (result.error) setSettings(settings) // revert
  }

  async function handleUnfollow() {
    setSaving(true)
    const result = await unfollowLegislation(legislationId)
    if (!result.error) setRemoved(true)
    setSaving(false)
  }

  if (removed) return null

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyle(status)}`}>
              {status}
            </span>
            <span className="font-mono text-xs text-slate-500">{file_number}</span>
          </div>
          <Link
            href={`/legislation/${slug}`}
            className="line-clamp-2 text-sm text-slate-200 hover:text-indigo-400 transition-colors"
          >
            {title}
          </Link>
        </div>
        <button
          onClick={handleUnfollow}
          disabled={saving}
          className="shrink-0 text-xs text-slate-600 hover:text-red-400 transition-colors"
        >
          Unwatch
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">Notify me:</span>
        <Toggle
          label="Updates"
          checked={settings.notify_updates}
          onChange={() => toggle('notify_updates')}
          disabled={saving}
        />
        <Toggle
          label="Hearings"
          checked={settings.notify_hearings}
          onChange={() => toggle('notify_hearings')}
          disabled={saving}
        />
        <Toggle
          label="Amendments"
          checked={settings.notify_amendments}
          onChange={() => toggle('notify_amendments')}
          disabled={saving}
        />
      </div>
    </div>
  )
}
