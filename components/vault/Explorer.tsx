'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, FileText, Folder, FolderOpen, Hash, Search } from 'lucide-react'
import type { NoteMeta } from '@/lib/vault'

type Dir = { name: string; path: string; dirs: Dir[]; files: NoteMeta[] }

const FOLDER_ORDER = ['Projects', 'Research', 'Activity', 'Tags']

function buildTree(notes: NoteMeta[]): Dir {
  const root: Dir = { name: 'Portfolio', path: '', dirs: [], files: [] }
  for (const n of notes) {
    const parts = n.path.split('/')
    let cur = root
    for (const part of parts.slice(0, -1)) {
      const path = cur.path ? `${cur.path}/${part}` : part
      let next = cur.dirs.find((d) => d.name === part)
      if (!next) { next = { name: part, path, dirs: [], files: [] }; cur.dirs.push(next) }
      cur = next
    }
    cur.files.push(n)
  }
  const order = (d: Dir) => {
    d.dirs.sort((a, b) => {
      const ia = FOLDER_ORDER.indexOf(a.name), ib = FOLDER_ORDER.indexOf(b.name)
      return ia >= 0 && ib >= 0 ? ia - ib : ia >= 0 ? -1 : ib >= 0 ? 1 : a.name.localeCompare(b.name)
    })
    d.dirs.forEach(order)
  }
  order(root)
  return root
}

const fileName = (n: NoteMeta) => n.path.split('/').pop()!.replace(/\.md$/, '')

/** 실제 OS 파일이 아니라, 포트폴리오에 등록된 노트를 폴더 트리로 보여줍니다. */
export function Explorer({ notes, activeId, onOpen }: { notes: NoteMeta[]; activeId: string | null; onOpen: (id: string) => void }) {
  const tree = useMemo(() => buildTree(notes), [notes])
  const [open, setOpen] = useState<Set<string>>(() => new Set(['Projects', 'Research', 'Activity']))
  const [q, setQ] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // 처음 그릴 때 Research 하위 폴더는 펼쳐 둡니다.
  useEffect(() => {
    setOpen((o) => {
      const n = new Set(o)
      tree.dirs.find((d) => d.name === 'Research')?.dirs.forEach((d) => n.add(d.path))
      return n
    })
  }, [tree])

  // 현재 노트의 위치를 트리에서 드러냅니다: 상위 폴더를 열고 보이게 스크롤
  useEffect(() => {
    const note = notes.find((n) => n.id === activeId)
    if (!note) return
    const parts = note.path.split('/').slice(0, -1)
    setOpen((o) => {
      const n = new Set(o)
      parts.forEach((_, i) => n.add(parts.slice(0, i + 1).join('/')))
      return n
    })
    requestAnimationFrame(() => {
      listRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
    })
  }, [activeId, notes])

  const toggle = (path: string) =>
    setOpen((o) => {
      const n = new Set(o)
      if (n.has(path)) n.delete(path)
      else n.add(path)
      return n
    })

  const term = q.trim().toLowerCase()
  const matches = term ? notes.filter((n) => fileName(n).toLowerCase().includes(term)) : []

  const fileRow = (n: NoteMeta, depth: number, showPath = false) => (
    <button
      key={n.id}
      type="button"
      className="fx-file"
      style={{ paddingLeft: 10 + depth * 14 }}
      aria-current={n.id === activeId ? 'page' : undefined}
      onClick={() => onOpen(n.id)}
      title={n.path}
    >
      {n.kind === 'tag' ? <Hash aria-hidden /> : <FileText aria-hidden />}
      <span className="fx-name">{fileName(n)}</span>
      {showPath && <span className="fx-path">{n.path.split('/').slice(0, -1).join('/') || '/'}</span>}
    </button>
  )

  const dirRow = (d: Dir, depth: number): React.ReactNode => {
    const isOpen = open.has(d.path)
    return (
      <div key={d.path} className="fx-dir">
        <button type="button" className="fx-folder" style={{ paddingLeft: 6 + depth * 14 }} aria-expanded={isOpen} onClick={() => toggle(d.path)}>
          <ChevronRight className="fx-caret" aria-hidden />
          {isOpen ? <FolderOpen aria-hidden /> : <Folder aria-hidden />}
          <span className="fx-name">{d.name}</span>
          <span className="fx-count num">{countFiles(d)}</span>
        </button>
        <div className={isOpen ? 'fx-children open' : 'fx-children'}>
          <div>
            {d.dirs.map((c) => dirRow(c, depth + 1))}
            {d.files.map((f) => fileRow(f, depth + 1))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <nav className="fx" aria-label="파일 탐색기">
      <p className="fx-vault num">Portfolio</p>
      <label className="fx-search">
        <Search aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="파일 이름 검색" aria-label="파일 이름 검색" />
      </label>
      <div className="fx-list" ref={listRef}>
        {term ? (
          matches.length ? matches.map((n) => fileRow(n, 0, true)) : <p className="fx-empty">일치하는 파일이 없습니다.</p>
        ) : (
          <>
            {tree.dirs.map((d) => dirRow(d, 0))}
            {tree.files.map((f) => fileRow(f, 0))}
          </>
        )}
      </div>
    </nav>
  )
}

function countFiles(d: Dir): number {
  return d.files.length + d.dirs.reduce((s, c) => s + countFiles(c), 0)
}

export default Explorer
