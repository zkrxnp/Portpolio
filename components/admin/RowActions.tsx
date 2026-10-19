'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

/** 삭제는 되돌릴 수 없으니 인라인으로 한 번 확인받습니다. (브라우저 confirm은 쓰지 않습니다) */
export function RowActions({ endpoint, label }: { endpoint: string; label: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    setBusy(true)
    setError('')
    const res = await fetch(endpoint, { method: 'DELETE' }).catch(() => null)
    setBusy(false)
    if (res?.ok) {
      router.refresh()
      return
    }
    const body = await res?.json().catch(() => ({}))
    setConfirming(false)
    setError(body?.error ?? '삭제하지 못했습니다.')
  }

  if (confirming) {
    return (
      <span className="confirm">
        <span className="confirm-q">「{label}」 삭제?</span>
        <button className="btn danger sm" onClick={remove} disabled={busy}>삭제</button>
        <button className="btn ghost sm" onClick={() => setConfirming(false)} disabled={busy}>취소</button>
      </span>
    )
  }

  return (
    <>
    {error && <span className="field-error" role="alert">{error} </span>}
    <button className="icon-btn" onClick={() => setConfirming(true)} aria-label={`${label} 삭제`}>
      <Trash2 />
    </button>
    </>
  )
}

export default RowActions
