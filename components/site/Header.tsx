'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import QuickSwitcher from './QuickSwitcher'
import ThemeToggle from './ThemeToggle'

const links = [
  { href: '/projects', label: '프로젝트', match: '/projects' },
  { href: '/blog', label: '기록', match: '/blog' },
  { href: '/?note=page:about', label: '소개', match: null },
  { href: '/contact', label: '연락', match: '/contact' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // 경로가 바뀌면 열린 메뉴를 닫습니다.
  useEffect(() => setOpen(false), [pathname])

  // 상세 페이지(/projects/xxx, /blog/xxx)에서도 상위 메뉴를 현재 위치로 표시합니다.
  const isCurrent = (match: string | null) =>
    match !== null && (pathname === match || pathname.startsWith(match + '/'))

  return (
    <header className="bar wrap" style={{ viewTransitionName: 'site-header' }}>
      <Link href="/" className="brand">정현진<em>Jeong Hyeonjin</em></Link>
      <nav className={open ? 'nav open' : 'nav'} aria-label="주요 메뉴">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={isCurrent(l.match) ? 'page' : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="bar-right">
        <QuickSwitcher />
        <ThemeToggle />
      </div>
      <button
        className="menu-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  )
}

export default Header
