import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="wrap" style={{ padding: '120px 0 140px' }}>
      <p className="note num">404</p>
      <h1 style={{ fontSize: 'clamp(30px, 4vw, 52px)', marginTop: 16 }}>이 주소에는 아무것도 없습니다</h1>
      <p className="hero-lede" style={{ marginTop: 20 }}>
        주소가 바뀌었거나, 아직 공개하지 않은 글일 수 있습니다.
      </p>
      <p style={{ marginTop: 28, display: 'flex', gap: 20 }}>
        <Link className="hero-link" href="/">홈으로</Link>
        <Link className="hero-link" href="/projects">작업 목록</Link>
      </p>
    </section>
  )
}
