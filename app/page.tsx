import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getProjects, getPosts } from '@/lib/data'
import Visual from '@/components/site/Visual'

export const revalidate = 60

export default async function HomePage() {
  const [projects, posts] = await Promise.all([
    getProjects({ limit: 3 }),
    getPosts({ limit: 3 }),
  ])

  return (
    <>
      <section id="top" className="hero wrap">
        <div>
          <h1 className="r1">공격의 흔적을 읽고<br />무너지기 전에 막습니다</h1>
          <p className="hero-lede r2">
            탐지 룰을 쓰고, 침해를 추적하고, 남아 있는 기록에서 사건의 순서를 복원합니다.
            보안을 막연한 불안이 아니라 다룰 수 있는 신호로 바꾸는 일을 합니다.
          </p>
          <Link className="hero-link r3" href="/projects">작업 보기</Link>
        </div>
        <dl className="ledger r4">
          <div className="row"><dt>분류</dt><dd>보안 연구, 침해 대응</dd></div>
          <div className="row"><dt>범위</dt><dd>리눅스 유저랜드, 사내망, 웹</dd></div>
          <div className="row"><dt>경력</dt><dd className="num">2021 — 현재</dd></div>
          <div className="row"><dt>상태</dt><dd>새 프로젝트를 받고 있습니다</dd></div>
        </dl>
      </section>

      <section className="wrap">
        <div className="section-head">
          <h2>작업</h2>
          <Link className="note link" href="/projects">전체 보기 →</Link>
        </div>

        {projects.length === 0 ? (
          <p className="empty">아직 등록된 프로젝트가 없습니다. 관리자 페이지에서 첫 프로젝트를 추가하세요.</p>
        ) : (
          projects.map((p) => (
            <article className="case" key={p._id}>
              <Link href={`/projects/${p.slug}`} className="case-visual" aria-label={`${p.title} 자세히 보기`}>
                <Visual kind={p.visual} />
              </Link>
              <div>
                <h3><Link href={`/projects/${p.slug}`}>{p.title}</Link></h3>
                <p className="case-desc">{p.summary}</p>
                <dl className="facts">
                  <div><dt>분야</dt><dd>{p.category}</dd></div>
                  {p.period && <div><dt>기간</dt><dd>{p.period}</dd></div>}
                  {p.role && <div><dt>역할</dt><dd>{p.role}</dd></div>}
                </dl>
              </div>
            </article>
          ))
        )}
      </section>

      {posts.length > 0 && (
        <section className="wrap" style={{ paddingTop: 110 }}>
          <div className="section-head">
            <h2>기록</h2>
            <Link className="note link" href="/blog">전체 보기 →</Link>
          </div>
          <ul className="note-list">
            {posts.map((p) => (
              <li key={p._id}>
                <Link href={`/blog/${p.slug}`}>
                  <span className="note-title">{p.title}</span>
                  <span className="note-meta num">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('ko-KR') : '초안'} · {p.readingMinutes}분
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="about" className="wrap" style={{ paddingTop: 110 }}>
        <div className="section-head">
          <h2>소개</h2>
          <p className="note">2021 — 현재</p>
        </div>
        <div className="about-grid">
          <h2>복잡한 위협을<br />읽을 수 있는 순서로</h2>
          <div>
            <p>보안은 불안을 키우는 일이 아니라, 보이지 않는 위험을 이해하고 통제할 수 있는 신호로 바꾸는 일이라고 생각합니다.</p>
            <p>그래서 경보를 많이 만드는 것보다, 사람이 읽고 바로 움직일 수 있는 경보를 만드는 데 시간을 씁니다.</p>
            <dl className="caps">
              <div><dt>영역</dt><dd>위협 헌팅, 사고 대응, 디지털 포렌식, 네트워크 보안</dd></div>
              <div><dt>도구</dt><dd className="num">Suricata, Zeek, Volatility, Ghidra</dd></div>
              <div><dt>언어</dt><dd className="num">C, Python, Go</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <div className="band" style={{ marginTop: 110 }}>
        <section className="contact wrap">
          <h2>지켜야 할 시스템이 있나요?</h2>
          <p className="sub">점검이든 사고 대응이든, 상황을 먼저 들어보고 필요한 범위를 같이 정하겠습니다.</p>
          <Link className="email" href="/contact">문의 보내기<ArrowUpRight /></Link>
        </section>
      </div>
    </>
  )
}
