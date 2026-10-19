'use client'

import type { NoteDetail, NoteRef } from '@/lib/vault'

const KIND: Record<string, string> = { project: '프로젝트', log: '기록', tag: '태그', activity: '활동', page: '페이지' }

/** 오른쪽 백링크 패널: 나가는 링크 · 들어오는 링크 · 관련 프로젝트 · 기술 태그 */
export function LinksPanel({ note, onOpen }: { note: NoteDetail | null; onOpen: (id: string) => void }) {
  if (!note) return <p className="lp-empty">노트를 열면 연결이 여기에 표시됩니다.</p>

  const group = (title: string, items: NoteRef[], hint: string) => (
    <section className="lp-group">
      <h3>{title} <span className="num">{items.length}</span></h3>
      {items.length === 0 ? (
        <p className="lp-none">{hint}</p>
      ) : (
        <ul>
          {items.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => onOpen(r.id)} className={`lp-item k-${r.kind}`}>
                <i aria-hidden />
                <span>{r.title}</span>
                <small>{KIND[r.kind]}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )

  return (
    <div className="lp">
      {group('이 노트를 참조하는 노트', note.backlinks.filter((r) => r.kind !== 'tag'), '아직 이 노트를 연결한 노트가 없습니다.')}
      {group('이 노트가 참조하는 노트', note.outgoing, '본문이나 속성에 연결된 노트가 없습니다.')}
      {group('관련 프로젝트', note.relatedProjects.filter((r) => r.id !== note.id), '연결된 프로젝트가 없습니다.')}
      {group('기술 · 태그', note.tagRefs, '붙은 태그가 없습니다.')}
      {note.unresolved.length > 0 && (
        <section className="lp-group">
          <h3>아직 없는 노트 <span className="num">{note.unresolved.length}</span></h3>
          <ul>{note.unresolved.map((u) => <li key={u} className="lp-unresolved">[[{u}]]</li>)}</ul>
        </section>
      )}
    </div>
  )
}

export default LinksPanel
