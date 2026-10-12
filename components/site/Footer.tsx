import Link from 'next/link'

export function Footer() {
  return (
    <footer className="wrap">
      <span>© {new Date().getFullYear()} 한지우 — 보안 포트폴리오</span>
      <span className="links">
        <a href="https://github.com" target="_blank" rel="noreferrer noopener">GitHub</a>
        <a href="https://linkedin.com" target="_blank" rel="noreferrer noopener">LinkedIn</a>
        <Link href="/admin">관리</Link>
      </span>
    </footer>
  )
}

export default Footer
