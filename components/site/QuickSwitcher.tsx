'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

type Item = { kind: '프로젝트' | '기록' | '페이지'; title: string; href: string; hint: string }

const PAGES: Item[] = [
  { kind: '페이지', title: '홈', href: '/', hint: '/' },
  { kind: '페이지', title: '프로젝트 목록', href: '/projects', hint: '/projects' },
  { kind: '페이지', title: '기록 목록', href: '/blog', hint: '/blog' },
  { kind: '페이지', title: '소개', href: '/#about', hint: '/#about' },
  { kind: '페이지', title: '활동', href: '/#activities', hint: '/#activities' },
  { kind: '페이지', title: '방명록', href: '/#guestbook', hint: '/#guestbook' },
  { kind: '페이지', title: '연락', href: '/contact', hint: '/contact' },
]

/**
 * 옵시디언의 빠른 이동(Quick Switcher). Ctrl+K / ⌘K 또는 헤더 버튼으로 엽니다.
 * 목록은 처음 열 때 공개 API에서 한 번 받아오고, 이후 검색은 브라우저 안에서 합니다.
 */
export function QuickSwitcher() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const load = useCallback(async () => {
    try {
      const [p, l] = await Promise.all([
        fetch('/api/projects?limit=50').then((r) => r.json()),
        fetch('/api/research-logs?limit=50').then((r) => r.json()),
      ])
      setItems([
        ...(p.items ?? []).map((x: { title: string; slug: string; category: string; stack: string[] }) => ({
          kind: '프로젝트' as const, title: x.title, href: `/projects/${x.slug}`, hint: [x.category, ...x.stack].join(' · '),
        })),
        ...(l.items ?? []).map((x: { title: string; slug: string; category: string; tags: string[] }) => ({
          kind: '기록' as const, title: x.title, href: `/blog/${x.slug}`, hint: [x.category, ...x.tags.map((t) => '#' + t)].join(' '),
        })),
      ])
    } catch {
      setFailed(true)
      setItems([])
    }
  }, [])

  const show = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null
    setOpen(true)
    setQ('')
    setActive(0)
    if (!items) load()
  }, [items, load])

  const hide = useCallback(() => {
    setOpen(false)
    returnFocus.current?.focus?.()
  }, [])

  // Ctrl+K / ⌘K 로 열고 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) hide()
        else show()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, show, hide])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const results = useMemo(() => {
    const all = [...(items ?? []), ...PAGES]
    const term = q.trim().toLowerCase()
    if (!term) return all.slice(0, 12)
    return all
      .map((it) => {
        const t = it.title.toLowerCase()
        const score = t.startsWith(term) ? 0 : t.includes(term) ? 1 : it.hint.toLowerCase().includes(term) ? 2 : 9
        return { it, score }
      })
      .filter((x) => x.score < 9)
      .sort((a, b) => a.score - b.score)
      .slice(0, 12)
      .map((x) => x.it)
  }, [items, q])

  function go(it: Item | undefined) {
    if (!it) return
    setOpen(false)
    router.push(it.href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); hide() }
  }

  return (
    <>
      <button type="button" className="qs-btn" onClick={show} aria-label="빠른 이동 열기 (Ctrl+K)">
        <Search aria-hidden />
        <span className="qs-label">이동</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open && (
        <div className="qs-backdrop" onMouseDown={hide}>
          <div className="qs" role="dialog" aria-modal="true" aria-label="빠른 이동" onMouseDown={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              className="qs-input"
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0) }}
              onKeyDown={onKeyDown}
              placeholder="프로젝트, 기록, 페이지 이름을 입력하세요"
              role="combobox"
              aria-expanded="true"
              aria-controls="qs-list"
              aria-activedescendant={results[active] ? `qs-${active}` : undefined}
            />
            <ul id="qs-list" className="qs-list" role="listbox">
              {items === null && <li className="qs-empty">불러오는 중…</li>}
              {failed && <li className="qs-empty">목록을 불러오지 못했습니다. 페이지만 검색됩니다.</li>}
              {items !== null && results.length === 0 && <li className="qs-empty">일치하는 항목이 없습니다.</li>}
              {results.map((it, i) => (
                <li
                  key={it.href}
                  id={`qs-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? 'qs-item on' : 'qs-item'}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(it)}
                >
                  <span className="qs-kind">{it.kind}</span>
                  <span className="qs-title">{it.title}</span>
                  <span className="qs-hint">{it.hint}</span>
                </li>
              ))}
            </ul>
            <p className="qs-foot num"><kbd>↑</kbd><kbd>↓</kbd> 이동 <kbd>Enter</kbd> 열기 <kbd>Esc</kbd> 닫기</p>
          </div>
        </div>
      )}
    </>
  )
}

export default QuickSwitcher
