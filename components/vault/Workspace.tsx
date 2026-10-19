'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, GitFork, Link2, PanelLeft, PanelRight, X } from 'lucide-react'
import type { NoteDetail, NoteMeta } from '@/lib/vault'
import Explorer from './Explorer'
import NoteView from './NoteView'
import LinksPanel from './LinksPanel'
import Graph, { type GLink, type GNode } from './Graph'

const GRAPH = 'graph'
const TABS_KEY = 'vault:tabs'

const apiPath = (id: string) => {
  const i = id.indexOf(':')
  return `/api/notes/${id.slice(0, i)}/${encodeURIComponent(id.slice(i + 1))}`
}
const urlFor = (id: string | null) => (id ? `/?note=${encodeURIComponent(id)}` : '/')
const readUrl = () => new URLSearchParams(window.location.search).get('note')
const isMobile = () => window.matchMedia('(max-width: 900px)').matches

/**
 * 옵시디언식 작업 공간.
 * 왼쪽 파일 탐색기 · 위쪽 탭 · 가운데 노트 · 오른쪽 백링크/로컬 그래프.
 * 열린 탭은 이 브라우저에만 기억하고(localStorage), 현재 노트는 주소(?note=)에 둡니다.
 */
export function Workspace({
  notes,
  initialNote,
  initialActive,
  graph,
  isAdmin,
}: {
  notes: NoteMeta[]
  initialNote: NoteDetail | null
  initialActive: string | null
  graph: { nodes: GNode[]; links: GLink[] }
  isAdmin: boolean
}) {
  const [tabs, setTabs] = useState<string[]>(initialActive ? [initialActive] : [])
  const [active, setActive] = useState<string | null>(initialActive)
  const [cache, setCache] = useState<Record<string, NoteDetail>>(initialNote ? { [initialNote.id]: initialNote } : {})
  const [status, setStatus] = useState<Record<string, 'loading' | 'error'>>({})
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [drawer, setDrawer] = useState<'left' | 'right' | null>(null)
  const [rightTab, setRightTab] = useState<'links' | 'graph'>('links')
  const lastNote = useRef<string | null>(initialActive !== GRAPH ? initialActive : null)
  const titleOf = (id: string) => (id === GRAPH ? '그래프 뷰' : notes.find((n) => n.id === id)?.title ?? id)

  const fetchNote = useCallback(async (id: string) => {
    setStatus((s) => ({ ...s, [id]: 'loading' }))
    try {
      const res = await fetch(apiPath(id))
      if (!res.ok) throw new Error(String(res.status))
      const { item } = await res.json()
      setCache((c) => ({ ...c, [id]: item }))
      setStatus((s) => { const n = { ...s }; delete n[id]; return n })
    } catch {
      setStatus((s) => ({ ...s, [id]: 'error' }))
    }
  }, [])

  const activate = useCallback((id: string | null, push: boolean) => {
    setActive(id)
    if (id && id !== GRAPH) lastNote.current = id
    if (id) setTabs((t) => (t.includes(id) ? t : [...t, id]))
    if (push && readUrl() !== id) window.history.pushState(null, '', urlFor(id))
    if (id && id !== GRAPH) {
      setCache((c) => {
        if (!c[id]) fetchNote(id)
        return c
      })
    }
    if (isMobile()) setDrawer(null)
  }, [fetchNote])

  const open = useCallback((id: string) => activate(id, true), [activate])

  function closeTab(id: string) {
    setTabs((t) => {
      const i = t.indexOf(id)
      const next = t.filter((x) => x !== id)
      if (id === active) {
        const neighbor = next[i] ?? next[i - 1] ?? null
        setActive(neighbor)
        window.history.replaceState(null, '', urlFor(neighbor))
        if (neighbor && neighbor !== GRAPH && !cache[neighbor]) fetchNote(neighbor)
      }
      return next
    })
  }

  // 이 브라우저에서 열어 두었던 탭 복원(현재 노트는 그대로 활성)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TABS_KEY) ?? '[]') as string[]
      const known = new Set([...notes.map((n) => n.id), GRAPH])
      setTabs((t) => [...new Set([...saved.filter((x) => known.has(x)), ...t])])
    } catch { /* 저장소를 못 쓰는 환경이면 무시 */ }
  }, [notes])

  useEffect(() => {
    try { localStorage.setItem(TABS_KEY, JSON.stringify(tabs)) } catch { /* 무시 */ }
  }, [tabs])

  // 뒤로·앞으로 가기로 노트 사이를 이동
  useEffect(() => {
    const onPop = () => activate(readUrl(), false)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [activate])

  // 다른 곳(빠른 이동·헤더 메뉴)에서 /?note=… 로 들어오면 그 노트를 엽니다.
  useEffect(() => {
    if (initialActive && initialActive !== active) activate(initialActive, false)
    if (initialNote) setCache((c) => (c[initialNote.id] ? c : { ...c, [initialNote.id]: initialNote }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialActive, initialNote])

  // 브라우저 탭 제목도 현재 노트로
  useEffect(() => {
    document.title = active ? `${titleOf(active)} — 정현진` : '정현진 — 보안 포트폴리오'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const note = active && active !== GRAPH ? cache[active] ?? null : null
  const sideNote = note ?? (lastNote.current ? cache[lastNote.current] ?? null : null)

  return (
    <div className="vault" data-left={leftOpen} data-right={rightOpen}>
      <div className="v-top">
        <button type="button" className="v-icon" onClick={() => (isMobile() ? setDrawer(drawer === 'left' ? null : 'left') : setLeftOpen((v) => !v))} aria-label="파일 탐색기 열고 닫기" title="파일 탐색기">
          <PanelLeft />
        </button>
        <div className="v-tabs" role="tablist" aria-label="열린 노트">
          {tabs.map((id) => (
            <div key={id} className={id === active ? 'v-tab on' : 'v-tab'} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={id === active}
                onClick={() => open(id)}
                onAuxClick={(e) => { if (e.button === 1) closeTab(id) }}
                title={titleOf(id)}
              >
                {id === GRAPH ? <GitFork aria-hidden /> : <FileText aria-hidden />}
                <span>{titleOf(id)}</span>
              </button>
              <button type="button" className="v-tab-x" onClick={() => closeTab(id)} aria-label={`${titleOf(id)} 탭 닫기`}><X /></button>
            </div>
          ))}
        </div>
        <button type="button" className="v-icon" onClick={() => open(GRAPH)} aria-label="그래프 뷰 열기" title="그래프 뷰"><GitFork /></button>
        <button type="button" className="v-icon" onClick={() => (isMobile() ? setDrawer(drawer === 'right' ? null : 'right') : setRightOpen((v) => !v))} aria-label="백링크 패널 열고 닫기" title="백링크 · 로컬 그래프">
          <PanelRight />
        </button>
      </div>

      <div className="v-body">
        <aside className={drawer === 'left' ? 'v-left drawer' : 'v-left'} aria-label="파일 탐색기">
          <Explorer notes={notes} activeId={active === GRAPH ? lastNote.current : active} onOpen={open} />
        </aside>

        <section className="v-center" aria-live="polite">
          {active === GRAPH ? (
            <div className="v-fade" key="graph">
              <Graph nodes={graph.nodes} links={graph.links} activeId={lastNote.current} onOpen={open} mode="global" />
            </div>
          ) : active && note ? (
            <div className="v-fade v-scroll" key={active}>
              <NoteView note={note} isAdmin={isAdmin} onOpen={open} />
            </div>
          ) : active && status[active] === 'error' ? (
            <div className="v-state">
              <p>노트를 불러오지 못했습니다.</p>
              <button type="button" className="btn ghost sm" onClick={() => fetchNote(active)}>다시 시도</button>
            </div>
          ) : active ? (
            <div className="v-state" aria-busy="true">
              <div className="skeleton" aria-hidden><i /><i /><i /></div>
              <p className="num">불러오는 중…</p>
            </div>
          ) : (
            <div className="v-state v-empty">
              <p>열린 노트가 없습니다.</p>
              <div className="v-empty-links">
                <button type="button" onClick={() => open('page:about')}>소개 열기</button>
                <button type="button" onClick={() => open(GRAPH)}>그래프 뷰 열기</button>
              </div>
              <p className="num nv-muted">왼쪽 탐색기에서 파일을 고르거나 Ctrl K로 찾아보세요.</p>
            </div>
          )}
          {note && (
            <p className="v-status num">
              <span>{note.backlinks.length} 백링크</span>
              <span>{note.outgoing.length} 링크</span>
              <span>{note.tagRefs.length} 태그</span>
            </p>
          )}
        </section>

        <aside className={drawer === 'right' ? 'v-right drawer' : 'v-right'} aria-label="연결">
          <div className="v-rtabs" role="tablist">
            <button type="button" role="tab" aria-selected={rightTab === 'links'} onClick={() => setRightTab('links')}><Link2 aria-hidden />백링크</button>
            <button type="button" role="tab" aria-selected={rightTab === 'graph'} onClick={() => setRightTab('graph')}><GitFork aria-hidden />로컬 그래프</button>
          </div>
          <div className="v-rbody">
            {rightTab === 'links' ? (
              <LinksPanel note={sideNote} onOpen={open} />
            ) : sideNote ? (
              <Graph nodes={graph.nodes} links={graph.links} activeId={sideNote.id} onOpen={open} mode="local" />
            ) : (
              <p className="lp-empty">노트를 열면 로컬 그래프가 표시됩니다.</p>
            )}
          </div>
        </aside>
      </div>

      {drawer && <button type="button" className="v-scrim" aria-label="패널 닫기" onClick={() => setDrawer(null)} />}
    </div>
  )
}

export default Workspace
