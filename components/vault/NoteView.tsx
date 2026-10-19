'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, PencilLine } from 'lucide-react'
import type { NoteDetail } from '@/lib/vault'
import Guestbook from '@/components/site/Guestbook'
import ContactForm from '@/components/site/ContactForm'

const KIND: Record<string, string> = { project: '프로젝트', log: '연구 기록', tag: '기술·태그', activity: '활동', page: '페이지' }

/**
 * 가운데 노트 뷰어. 본문 HTML은 서버에서 정리(DOMPurify)와 링크 변환을 마친 것입니다.
 * 본문 안 노트 링크(data-note)는 가로채서 작업 공간 안에서 탭으로 엽니다.
 */
export function NoteView({
  note,
  isAdmin,
  onOpen,
}: {
  note: NoteDetail
  isAdmin: boolean
  onOpen: (id: string) => void
}) {
  const [missing, setMissing] = useState<string | null>(null)

  function onClick(e: React.MouseEvent) {
    const a = (e.target as HTMLElement).closest('a')
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    const id = a.getAttribute('data-note')
    if (id) {
      e.preventDefault()
      onOpen(id)
    } else if (a.classList.contains('is-unresolved')) {
      e.preventDefault()
      setMissing(a.textContent ?? '')
    }
  }

  const editHref =
    isAdmin && note.dbId
      ? note.kind === 'project' ? `/admin/projects/${note.dbId}` : note.kind === 'log' ? `/admin/posts/${note.dbId}` : null
      : null

  return (
    <article className="nv" onClick={onClick}>
      <header className="nv-head">
        <p className="nv-path num">{note.path.replace(/\.md$/, '').split('/').join(' / ')}</p>
        <h1>{note.title}</h1>
        <div className="nv-actions">
          {note.pageUrl && (
            <Link href={note.pageUrl} className="nv-btn"><ExternalLink aria-hidden />일반 페이지로 보기</Link>
          )}
          {editHref && (
            <Link href={editHref} className="nv-btn"><PencilLine aria-hidden />편집</Link>
          )}
        </div>
      </header>

      {note.properties.length > 0 && (
        <dl className="nv-props" aria-label="속성">
          {note.properties.map((p) => (
            <div key={p.label}>
              <dt>{p.label}</dt>
              <dd>
                {p.links ? (
                  p.links.length ? (
                    p.links.map((r) => (
                      <a key={r.id} href={`/?note=${encodeURIComponent(r.id)}`} data-note={r.id} className={r.kind === 'tag' ? 'nv-tag' : 'internal-link'}>
                        {r.kind === 'tag' ? `#${r.title}` : r.title}
                      </a>
                    ))
                  ) : <span className="nv-muted">—</span>
                ) : p.href ? (
                  <a href={p.href} target={p.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="link">{p.text} ↗</a>
                ) : (
                  p.text
                )}
              </dd>
            </div>
          ))}
          <div><dt>종류</dt><dd>{KIND[note.kind]}</dd></div>
        </dl>
      )}

      {missing !== null && (
        <p className="nv-missing" role="status">
          <strong>[[{missing}]]</strong> 노트는 아직 없습니다.
          <button type="button" onClick={() => setMissing(null)}>닫기</button>
        </p>
      )}

      {note.special === 'guestbook' ? (
        <div className="nv-special"><Guestbook /></div>
      ) : note.special === 'contact' ? (
        <div className="nv-special"><ContactForm /></div>
      ) : note.html ? (
        <div className="prose nv-body" dangerouslySetInnerHTML={{ __html: note.html }} />
      ) : (
        <p className="nv-muted">내용이 없습니다.</p>
      )}
    </article>
  )
}

export default NoteView
