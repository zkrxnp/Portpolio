'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/** Research Log 공개 여부를 목록에서 바로 바꿉니다. 실패하면 이유를 그 자리에 표시합니다. */
export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function toggle() {
    setBusy(true)
    setError('')
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ published: !published }),
    }).catch(() => null)
    setBusy(false)
    if (res?.ok) {
      router.refresh()
      return
    }
    const body = await res?.json().catch(() => ({}))
    setError(body?.error ?? '바꾸지 못했습니다.')
  }

  return (
    <>
      <button
        type="button"
        className={published ? 'pill on' : 'pill'}
        onClick={toggle}
        disabled={busy}
        aria-pressed={published}
        title="눌러서 공개 여부 바꾸기"
      >
        {busy ? '…' : published ? '공개' : '비공개'}
      </button>
      {error && <em className="field-error" role="alert"> {error}</em>}
    </>
  )
}

export default PublishToggle
