'use client'

import { useState } from 'react'
import { setEmailDigests } from '@/app/actions/profile'

export default function DigestToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    const next = !enabled
    setEnabled(next)
    setPending(true)
    setError(null)

    const result = await setEmailDigests(next)

    setPending(false)
    if (result.error) {
      setEnabled(!next) // revert
      setError(result.error)
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        onClick={handleToggle}
        disabled={pending}
        aria-pressed={enabled}
        aria-label={enabled ? 'Disable daily digest' : 'Enable daily digest'}
        className={[
          'relative h-6 w-11 rounded-full border-2 transition-colors duration-200',
          enabled
            ? 'border-indigo-500 bg-indigo-500'
            : 'border-slate-600 bg-slate-700',
          pending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
            enabled ? 'left-[18px]' : 'left-0.5',
          ].join(' ')}
        />
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
