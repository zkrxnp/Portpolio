'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

const tabs = [
  { href: '/admin', label: '개요' },
  { href: '/admin/projects', label: '프로젝트' },
  { href: '/admin/posts', label: '기록' },
  { href: '/admin/guestbook', label: '방명록' },
  { href: '/admin/messages', label: '문의' },
]

export function AdminNav({ name, login }: { name: string; login: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="admin-bar">
      <nav className="admin-tabs" aria-label="관리 메뉴">
        {tabs.map((t) => {
          const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href)
          return (
            <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined}>
              {t.label}
            </Link>
          )
        })}
      </nav>
      <div className="admin-user">
        <span>{name}{login && ` (@${login})`}</span>
        <button onClick={logout} className="btn ghost sm"><LogOut /> 로그아웃</button>
      </div>
    </header>
  )
}

export default AdminNav
