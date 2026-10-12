'use client'

import { useEffect, useState } from 'react'

/**
 * 마운트 후 한 번만 증가시킵니다. React 18+의 StrictMode는 개발 모드에서
 * 이펙트를 두 번 돌리므로 ref 대신 세션 스토리지로 중복을 막습니다.
 */
export function ViewCounter({
  type,
  slug,
  initial,
}: {
  type: 'project' | 'post'
  slug: string
  initial: number
}) {
  const [views, setViews] = useState(initial)

  useEffect(() => {
    const key = `viewed:${type}:${slug}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    fetch(`/api/views/${type}/${slug}`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.views) setViews(d.views) })
      .catch(() => { /* 조회수는 실패해도 페이지에 영향 없음 */ })
  }, [type, slug])

  return <span className="num">{views.toLocaleString('ko-KR')}회</span>
}

export default ViewCounter
