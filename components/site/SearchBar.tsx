'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Search } from 'lucide-react'

/**
 * 검색어는 디바운스해서 URL에 반영합니다. 상태를 URL에 두면 뒤로가기와
 * 링크 공유가 그대로 동작합니다.
 */
export function SearchBar({
  placeholder,
  filters,
  activeFilter,
  filterKey,
  initialQuery,
}: {
  placeholder: string
  filters: string[]
  activeFilter: string
  filterKey: string
  initialQuery: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [value, setValue] = useState(initialQuery)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const current = params.get('q') ?? ''
    if (value === current) return

    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set('q', value)
      else next.delete('q')
      startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }))
    }, 300)

    return () => clearTimeout(id)
  }, [value, params, pathname, router])

  function setFilter(f: string) {
    const next = new URLSearchParams(params.toString())
    if (f && f !== '전체') next.set(filterKey, f)
    else next.delete(filterKey)
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }))
  }

  return (
    <div className={pending ? 'searchbar pending' : 'searchbar'}>
      <label className="search-field">
        <Search aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </label>
      {filters.length > 1 && (
        <div className="filters" role="group" aria-label="분류 필터">
          {filters.map((f) => (
            <button key={f} className="filter" aria-pressed={activeFilter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
