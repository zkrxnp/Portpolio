'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

/** 삭제는 되돌릴 수 없으니 인라인으로 한 번 확인받습니다. (브라우저 confirm은 쓰지 않습니다) */
export function RowActions({ endpoint, label }: { endpoint: string; label: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function remove() {
    setBusy(true)
    const res = await fetch(endpoint, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) router.refresh()
    else setConfirming(false)
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
    <button className="icon-btn" onClick={() => setConfirming(true)} aria-label={`${label} 삭제`}>
      <Trash2 />
    </button>
  )
}

export default RowActions
