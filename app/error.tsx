'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="wrap" style={{ padding: '120px 0 140px' }}>
      <p className="note num">500</p>
      <h1 style={{ fontSize: 'clamp(30px, 4vw, 52px)', marginTop: 16 }}>페이지를 그리지 못했습니다</h1>
      <p className="hero-lede" style={{ marginTop: 20 }}>
        데이터베이스 연결이 끊겼을 수 있습니다. 다시 시도해보고, 계속되면 환경 변수를 확인하세요.
      </p>
      <p style={{ marginTop: 28 }}>
        <button className="btn" onClick={reset}>다시 시도</button>
      </p>
    </section>
  )
}
