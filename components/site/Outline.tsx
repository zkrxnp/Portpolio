'use client'

import { useEffect, useState } from 'react'
import type { Heading } from '@/lib/markdown'

/** 옵시디언 개요(Outline) 패널. 지금 읽고 있는 소제목을 표시합니다. */
export function Outline({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(headings[0]?.id)

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [headings])

  if (headings.length === 0) return null
  return (
    <nav className="outline" aria-label="개요">
      <p className="outline-title num">개요</p>
      <ul>
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'lv3' : undefined}>
            <a href={`#${h.id}`} aria-current={active === h.id ? 'location' : undefined}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Outline
