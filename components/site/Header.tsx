'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '/projects', label: 'work' },
  { href: '/blog', label: 'notes' },
  { href: '/#about', label: 'about' },
  { href: '/contact', label: 'contact' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // 경로가 바뀌면 열린 메뉴를 닫습니다.
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="bar wrap">
      <Link href="/" className="brand">한지우<em>Han Jiwoo</em></Link>
      <nav className={open ? 'nav open' : 'nav'} aria-label="주요 메뉴">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="status"><span className="dot" />서울에서 협업 가능</p>
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
