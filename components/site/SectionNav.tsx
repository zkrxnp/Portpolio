'use client'

import { useEffect, useState } from 'react'

type Item = { id: string; label: string }

/**
 * 2단 레이아웃 왼쪽의 섹션 목차. 화면 위쪽 1/3을 지나는 섹션을 현재 위치로 봅니다.
 */
export function SectionNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    const targets = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-30% 0px -65% 0px' },
    )
    targets.forEach((t) => io.observe(t))

    // 마지막 섹션이 짧으면 판정선까지 못 올라오므로, 페이지 끝에 닿으면 마지막을 켭니다.
    const onScroll = () => {
      const el = document.documentElement
      if (el.scrollTop + window.innerHeight >= el.scrollHeight - 4 && targets.length) {
        setActive(targets[targets.length - 1].id)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [items])

  return (
    <nav className="side-nav" aria-label="섹션">
      {items.map((i) => (
        <a key={i.id} href={`#${i.id}`} className={active === i.id ? 'active' : undefined} aria-current={active === i.id ? 'location' : undefined}>
          <span className="line" aria-hidden />
          {i.label}
        </a>
      ))}
    </nav>
  )
}

export default SectionNav
