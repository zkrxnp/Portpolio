'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { renderMarkdown } from '@/lib/markdown'
import { LOG_CATEGORIES } from '@/lib/models/Post'

export type ProjectOption = { _id: string; title: string }

type Form = {
  title: string
  slug: string
  excerpt: string
  body: string
  tags: string[]
  category: string
  relatedProjectIds: string[]
  published: boolean
}

const EMPTY: Form = { title: '', slug: '', excerpt: '', body: '', tags: [], category: '기타', relatedProjectIds: [], published: false }

export function PostEditor({
  mode,
  id,
  initial,
  projects = [],
}: {
  mode: 'create' | 'edit'
  id?: string
  initial?: Form
  projects?: ProjectOption[]
}) {
  const router = useRouter()
  const [form, setForm] = useState<Form>(initial ?? EMPTY)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // marked + DOMPurify는 브라우저에서도 동작하므로 미리보기를 서버 왕복 없이 그립니다.
  const html = useMemo(() => (tab === 'preview' ? renderMarkdown(form.body) : ''), [tab, form.body])
  const minutes = Math.max(1, Math.round(form.body.trim().split(/\s+/).filter(Boolean).length / 300))

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})

    const url = mode === 'create' ? '/api/admin/posts' : `/api/admin/posts/${id}`
    const res = await fetch(url, {
      method: mode === 'create' ? 'POST' : 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      if (Array.isArray(data.issues)) {
        setErrors(Object.fromEntries(data.issues.map((i: { path: string; message: string }) => [i.path, i.message])))
      }
      setError(data.error ?? '저장하지 못했습니다.')
      setBusy(false)
      return
    }

    router.push('/admin/posts')
    router.refresh()
  }

  return (
    <form className="editor" onSubmit={save}>
      <div className="admin-head">
        <h1 className="admin-title">{mode === 'create' ? '새 글' : '글 수정'}</h1>
        <div className="quick">
          <Link className="btn ghost" href="/admin/posts">취소</Link>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? <><Loader2 className="spin" /> 저장 중</> : '저장'}
          </button>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="editor-grid">
        <div className="editor-main">
          <label className="field">
            <span>제목</span>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required maxLength={140} />
            {errors.title && <em className="field-error">{errors.title}</em>}
          </label>

          <label className="field">
            <span>슬러그 <small>비우면 제목에서 자동 생성</small></span>
            <input className="num" value={form.slug} onChange={(e) => set('slug', e.target.value)} />
          </label>

          <label className="field">
            <span>요약 <small>비우면 본문 앞부분에서 자동 생성</small></span>
            <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} maxLength={400} />
          </label>

          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'write'} onClick={() => setTab('write')}>작성</button>
            <button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>미리보기</button>
            <span className="tabs-note num">{minutes}분 분량</span>
          </div>

          {tab === 'write' ? (
            <textarea
              className="num mono body-area"
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              rows={26}
              placeholder={'## 들어가며\n\n본문을 마크다운으로 씁니다.\n\n```c\nint main(void) { return 0; }\n```\n'}
            />
          ) : (
            <div className="prose preview" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>

        <aside className="editor-side">
          <div className="side-box">
            <label className="field">
              <span>분류</span>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {LOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="field">
              <span>태그 <small>쉼표로 구분</small></span>
              <input
                value={form.tags.join(', ')}
                onChange={(e) => set('tags', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="리버싱, 포렌식"
              />
            </label>
            <label className="check">
              <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
              <span>발행</span>
            </label>
            <p className="side-note">발행을 켜면 그 시점이 발행일로 기록됩니다. 끄면 방문자에게 보이지 않습니다.</p>
          </div>

          {projects.length > 0 && (
            <fieldset className="side-box">
              <legend className="side-note">관련 프로젝트</legend>
              {projects.map((p) => (
                <label className="check" key={p._id}>
                  <input
                    type="checkbox"
                    checked={form.relatedProjectIds.includes(p._id)}
                    onChange={(e) =>
                      set('relatedProjectIds', e.target.checked
                        ? [...form.relatedProjectIds, p._id]
                        : form.relatedProjectIds.filter((x) => x !== p._id))
                    }
                  />
                  <span>{p.title}</span>
                </label>
              ))}
            </fieldset>
          )}
        </aside>
      </div>
    </form>
  )
}

export default PostEditor
