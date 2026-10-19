'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Search } from 'lucide-react'

export type SelectControl = {
  key: string
  label: string
  value: string
  options: { value: string; label: string }[]
}

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
  selects = [],
}: {
  placeholder: string
  filters: string[]
  activeFilter: string
  filterKey: string
  initialQuery: string
  /** 기술·상태·정렬 같은 추가 조건. 바꾸면 해당 키만 URL에서 바뀝니다. */
  selects?: SelectControl[]
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

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value && value !== '전체') next.set(key, value)
    else next.delete(key)
    next.delete('page')
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }))
  }

  const setFilter = (f: string) => setParam(filterKey, f)

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
      {selects.length > 0 && (
        <div className="selects">
          {selects.map((sel) => (
            <label key={sel.key} className="select-field">
              <span>{sel.label}</span>
              <select value={sel.value} onChange={(e) => setParam(sel.key, e.target.value)}>
                {sel.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
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
