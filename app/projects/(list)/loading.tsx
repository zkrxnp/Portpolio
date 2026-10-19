// 서버에서 목록을 가져오는 동안 보여주는 자리 표시. 스크린리더에는 상태만 알립니다.
export default function Loading() {
  return (
    <section className="wrap page" aria-busy="true">
      <header className="page-head">
        <p className="sec-no">프로젝트</p>
        <p className="sec-count num" role="status">불러오는 중…</p>
      </header>
      <div className="skeleton" aria-hidden><i /><i /><i /></div>
    </section>
  )
}
