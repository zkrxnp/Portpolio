'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

type Item = {
  _id: string
  name: string
  email: string
  org: string
  kind: string
  body: string
  status: string
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  new: '새 문의', read: '읽음', replied: '답장함', archived: '보관',
}
const FILTERS = ['전체', 'new', 'read', 'replied', 'archived']

export function MessageList({ items }: { items: Item[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState('전체')
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const visible = filter === '전체' ? items : items.filter((m) => m.status === filter)

  async function setStatus(id: string, status: string) {
    setBusy(id)
    await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setBusy(null)
    router.refresh()
  }

  async function remove(id: string) {
    setBusy(id)
    await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
    setBusy(null)
    router.refresh()
  }

  // 펼칠 때 '새 문의'는 자동으로 읽음 처리합니다.
  function toggle(m: Item) {
    const next = open === m._id ? null : m._id
    setOpen(next)
    if (next && m.status === 'new') setStatus(m._id, 'read')
  }

  return (
    <>
      <div className="filters" role="group" aria-label="상태 필터">
        {FILTERS.map((f) => (
          <button key={f} className="filter" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === '전체' ? '전체' : STATUS_LABEL[f]}
            <span className="num">
              {' '}{f === '전체' ? items.length : items.filter((m) => m.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="empty">해당하는 문의가 없습니다.</p>
      ) : (
        <ul className="msg-list">
          {visible.map((m) => (
            <li key={m._id} className={m.status === 'new' ? 'msg unread' : 'msg'}>
              <button className="msg-head" onClick={() => toggle(m)} aria-expanded={open === m._id}>
                <span className="msg-who">
                  <strong>{m.name}</strong>
                  {m.org && <small>{m.org}</small>}
                </span>
                <span className="msg-kind">{m.kind}</span>
                <span className="msg-date num">{new Date(m.createdAt).toLocaleDateString('ko-KR')}</span>
                <span className={`pill ${m.status === 'new' ? 'on' : ''}`}>{STATUS_LABEL[m.status]}</span>
              </button>

              {open === m._id && (
                <div className="msg-body">
                  <p className="msg-text">{m.body}</p>
                  <div className="msg-actions">
                    <a className="btn ghost sm" href={`mailto:${m.email}?subject=${encodeURIComponent('[회신] 문의 주신 건')}`}>
                      {m.email}로 답장
                    </a>
                    <button className="btn ghost sm" disabled={busy === m._id} onClick={() => setStatus(m._id, 'replied')}>답장함으로</button>
                    <button className="btn ghost sm" disabled={busy === m._id} onClick={() => setStatus(m._id, 'archived')}>보관</button>
                    <button className="icon-btn danger" disabled={busy === m._id} onClick={() => remove(m._id)} aria-label="문의 삭제">
                      <Trash2 />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default MessageList
