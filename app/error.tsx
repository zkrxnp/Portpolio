'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="wrap" style={{ padding: '120px 0 140px' }}>
      <p className="note num">500</p>
      <h1 style={{ fontSize: 'clamp(30px, 4vw, 52px)', marginTop: 16 }}>오류</h1>
      <p style={{ marginTop: 28 }}>
        <button className="btn" onClick={reset}>다시 시도</button>
      </p>
    </section>
  )
}
