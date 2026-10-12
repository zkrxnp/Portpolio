'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { PROJECT_CATEGORIES, PROJECT_VISUALS } from '@/lib/models/Project'
import Visual from '@/components/site/Visual'

type Form = {
  title: string
  slug: string
  summary: string
  body: string
  category: string
  visual: string
  period: string
  role: string
  stack: string[]
  links: { repo: string; writeup: string; demo: string }
  featured: boolean
  published: boolean
  order: number
}

const EMPTY: Form = {
  title: '', slug: '', summary: '', body: '',
  category: PROJECT_CATEGORIES[0], visual: 'none',
  period: '', role: '', stack: [],
  links: { repo: '', writeup: '', demo: '' },
  featured: false, published: true, order: 0,
}

export function ProjectEditor({
  mode,
  id,
  initial,
}: {
  mode: 'create' | 'edit'
  id?: string
  initial?: Form
}) {
  const router = useRouter()
  const [form, setForm] = useState<Form>(initial ?? EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})

    const url = mode === 'create' ? '/api/admin/projects' : `/api/admin/projects/${id}`
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

    router.push('/admin/projects')
    router.refresh()
  }

  return (
    <form className="editor" onSubmit={save}>
      <div className="admin-head">
        <h1 className="admin-title">{mode === 'create' ? '프로젝트 추가' : '프로젝트 수정'}</h1>
        <div className="quick">
          <Link className="btn ghost" href="/admin/projects">취소</Link>
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
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required maxLength={80} />
            {errors.title && <em className="field-error">{errors.title}</em>}
          </label>

          <label className="field">
            <span>슬러그 <small>비우면 제목에서 자동 생성</small></span>
            <input className="num" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="blue-team-lab" />
          </label>

          <label className="field">
            <span>요약 <small>목록 카드에 보이는 한두 문장</small></span>
            <textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={3} required maxLength={300} />
            {errors.summary && <em className="field-error">{errors.summary}</em>}
          </label>

          <label className="field">
            <span>본문 <small>마크다운</small></span>
            <textarea className="num mono" value={form.body} onChange={(e) => set('body', e.target.value)} rows={18}
              placeholder={'## 배경\n\n어떤 문제였는지...\n\n## 한 일\n\n- 탐지 룰 작성\n'} />
          </label>
        </div>

        <aside className="editor-side">
          <div className="side-box">
            <label className="field">
              <span>분야</span>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="field">
              <span>썸네일 그래픽</span>
              <select value={form.visual} onChange={(e) => set('visual', e.target.value)}>
                {PROJECT_VISUALS.map((v) => (
                  <option key={v} value={v}>
                    {v === 'log' ? '탐지 로그' : v === 'trust' ? '신뢰 경계' : v === 'hex' ? '헥스 덤프' : '없음'}
                  </option>
                ))}
              </select>
            </label>

            {form.visual !== 'none' && (
              <div className="visual-preview"><Visual kind={form.visual} /></div>
            )}
          </div>

          <div className="side-box">
            <label className="field">
              <span>기간</span>
              <input value={form.period} onChange={(e) => set('period', e.target.value)} placeholder="2024" maxLength={40} />
            </label>
            <label className="field">
              <span>역할</span>
              <input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="탐지 룰 설계, 오탐 튜닝" maxLength={120} />
            </label>
            <label className="field">
              <span>기술 스택 <small>쉼표로 구분</small></span>
              <input
                value={form.stack.join(', ')}
                onChange={(e) => set('stack', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="Suricata, Zeek, Python"
              />
            </label>
          </div>

          <div className="side-box">
            <label className="field">
              <span>저장소 링크</span>
              <input className="num" value={form.links.repo} onChange={(e) => set('links', { ...form.links, repo: e.target.value })} />
            </label>
            <label className="field">
              <span>라이트업 링크</span>
              <input className="num" value={form.links.writeup} onChange={(e) => set('links', { ...form.links, writeup: e.target.value })} />
            </label>
          </div>

          <div className="side-box">
            <label className="check">
              <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
              <span>사이트에 공개</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              <span>목록 맨 위에 고정</span>
            </label>
            <label className="field">
              <span>정렬 순서 <small>작을수록 앞</small></span>
              <input className="num" type="number" min={0} max={999} value={form.order}
                onChange={(e) => set('order', Number(e.target.value) || 0)} />
            </label>
          </div>
        </aside>
      </div>
    </form>
  )
}

export default ProjectEditor
