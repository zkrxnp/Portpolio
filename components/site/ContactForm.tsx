'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

const KINDS = ['프로젝트·협업', '스터디·세미나', '채용·인턴', '기타'] as const

type FieldErrors = Record<string, string>

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    setError('')
    setFieldErrors({})

    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (Array.isArray(data.issues)) {
          setFieldErrors(Object.fromEntries(data.issues.map((i: { path: string; message: string }) => [i.path, i.message])))
        }
        setError(data.error ?? '보내지 못했습니다.')
        setState('idle')
        return
      }

      setState('sent')
    } catch {
      setError('네트워크 오류로 보내지 못했습니다. 잠시 뒤 다시 시도하세요.')
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <div className="form-done" role="status">
        <Check />
        <p>문의가 접수됐습니다. 영업일 기준 2일 안에 답장드리겠습니다.</p>
        <button className="btn ghost" onClick={() => setState('idle')}>하나 더 보내기</button>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {/* 봇 전용 필드. 사람에게는 보이지 않습니다. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="honeypot" aria-hidden />

      <label className="field">
        <span>이름</span>
        <input name="name" required maxLength={60} autoComplete="name" aria-invalid={!!fieldErrors.name} />
        {fieldErrors.name && <em className="field-error">{fieldErrors.name}</em>}
      </label>

      <label className="field">
        <span>이메일</span>
        <input name="email" type="email" required maxLength={160} autoComplete="email" aria-invalid={!!fieldErrors.email} />
        {fieldErrors.email && <em className="field-error">{fieldErrors.email}</em>}
      </label>

      <label className="field">
        <span>소속 <small>선택</small></span>
        <input name="org" maxLength={100} autoComplete="organization" />
      </label>

      <label className="field">
        <span>문의 종류</span>
        <select name="kind" defaultValue="기타">
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>

      <label className="field">
        <span>내용</span>
        <textarea name="body" required rows={7} maxLength={4000} aria-invalid={!!fieldErrors.body}
          placeholder="어떤 시스템인지, 지금 어떤 상황인지 적어주시면 범위를 잡기 좋습니다." />
        {fieldErrors.body && <em className="field-error">{fieldErrors.body}</em>}
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button className="btn" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? <><Loader2 className="spin" /> 보내는 중</> : '문의 보내기'}
      </button>
    </form>
  )
}

export default ContactForm
