import Link from 'next/link'

export function Footer() {
  return (
    <footer className="wrap">
      <span>© {new Date().getFullYear()} 정현진 — 보안 포트폴리오</span>
      <span className="links">
        <Link href="/admin">관리</Link>
      </span>
    </footer>
  )
}

export default Footer
