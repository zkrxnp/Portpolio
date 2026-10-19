'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

type Entry = { _id: string; name: string; message: string; createdAt: string }
type PageData = { items: Entry[]; total: number; page: number; pages: number }

const LIMIT = 6
const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

/**
 * 방명록. 메시지는 React가 텍스트로 출력하므로(dangerouslySetInnerHTML 없음)
 * 누가 <script>를 적어도 글자로만 보입니다.
 */
export function Guestbook() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PageData | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // 허니팟
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [notice, setNotice] = useState('')

  const load = useCallback(async (p: number) => {
    setLoadState('loading')
    try {
      const res = await fetch(`/api/guestbook?page=${p}&limit=${LIMIT}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      setData(await res.json())
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    load(page)
  }, [page, load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setNotice('')

    // 서버와 같은 기준으로 먼저 걸러 왕복을 줄입니다. 최종 판정은 서버가 합니다.
    const local: Record<string, string> = {}
    if (!name.trim()) local.name = '이름을 입력하세요.'
    if (message.trim().length < 2) local.message = '메시지를 2자 이상 적어주세요.'
    if (Object.keys(local).length) {
      setErrors(local)
      return
    }

    setSendState('sending')
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, message, website }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 201) {
        setMessage('')
        setSendState('done')
        setNotice('등록했습니다.')
        if (page === 1) load(1)
        else setPage(1)
        return
      }
      if (Array.isArray(body.issues)) {
        setErrors(Object.fromEntries(body.issues.map((i: { path: string; message: string }) => [i.path, i.message])))
      }
      setSendState('error')
      setNotice(
        res.status === 429
          ? '잠시 뒤에 다시 남겨주세요.'
          : body.error ?? '등록하지 못했습니다. 잠시 뒤에 다시 시도해주세요.',
      )
    } catch {
      setSendState('error')
      setNotice('네트워크 문제로 등록하지 못했습니다.')
    }
  }

  return (
    <div className="gb">
      <form className="gb-form" onSubmit={submit} noValidate>
        <label className="field">
          <span>이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="nickname"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <em className="field-error">{errors.name}</em>}
        </label>
        <label className="field">
          <span>메시지 <small className="num">{message.trim().length}/500</small></span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={500}
            aria-invalid={Boolean(errors.message)}
          />
          {errors.message && <em className="field-error">{errors.message}</em>}
        </label>
        <input
          className="honeypot"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          name="website"
        />
        <div className="gb-actions">
          <button className="btn" type="submit" disabled={sendState === 'sending'}>
            {sendState === 'sending' ? <><Loader2 className="spin" /> 남기는 중</> : '남기기'}
          </button>
          {notice && (
            <p className={sendState === 'done' ? 'gb-notice ok' : 'gb-notice err'} role="status">{notice}</p>
          )}
        </div>
      </form>

      <div className="gb-list" aria-live="polite" aria-busy={loadState === 'loading'}>
        {loadState === 'error' && (
          <p className="empty">
            방명록을 불러오지 못했습니다. <button className="link-btn" onClick={() => load(page)}>다시 시도</button>
          </p>
        )}
        {loadState === 'loading' && !data && <p className="empty">불러오는 중…</p>}
        {data && data.items.length === 0 && loadState !== 'error' && <p className="empty">아직 메시지가 없습니다.</p>}
        {data && data.items.length > 0 && (
          <>
            <ol className={loadState === 'loading' ? 'gb-items dim' : 'gb-items'}>
              {data.items.map((e) => (
                <li key={e._id}>
                  <p className="gb-head">
                    <strong>{e.name}</strong>
                    <time className="num" dateTime={e.createdAt}>{fmt(e.createdAt)}</time>
                  </p>
                  <p className="gb-msg">{e.message}</p>
                </li>
              ))}
            </ol>
            {data.pages > 1 && (
              <nav className="pager num" aria-label="방명록 페이지">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>← 최신</button>
                <span>{page} / {data.pages}</span>
                <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages}>이전 →</button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Guestbook
