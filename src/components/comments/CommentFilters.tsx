'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type Sort = 'latest' | 'most_engaged'

export default function CommentFilters({ currentSort }: { currentSort: Sort }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setSort(sort: Sort) {
    const params = new URLSearchParams(searchParams.toString())
    if (sort === 'latest') {
      params.delete('sort')
    } else {
      params.set('sort', sort)
    }
    router.replace(`${pathname}?${params.toString()}#comments`, { scroll: false })
  }

  const options: { value: Sort; label: string }[] = [
    { value: 'latest', label: 'Latest' },
    { value: 'most_engaged', label: 'Most Engaged' },
  ]

  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setSort(opt.value)}
          className={[
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            currentSort === opt.value
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-500 hover:text-slate-300',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
