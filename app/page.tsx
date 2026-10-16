import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getProjects, getPosts } from '@/lib/data'
import Visual from '@/components/site/Visual'
import { PageTransition, SharedVisual } from '@/components/site/PageTransition'

export const revalidate = 60

export default async function HomePage() {
  const [projects, posts] = await Promise.all([
    getProjects({ limit: 3 }),
    getPosts({ limit: 3 }),
  ])

  return (
    <PageTransition>
      <section id="top" className="hero wrap">
        <div>
          <h1 className="r1">왜 그렇게 동작하는지<br /><span className="grad">끝까지 따라갑니다</span></h1>
          <p className="hero-lede r2">
            리버싱으로 보안을 시작해 시스템 해킹과 공급망 보안까지 왔습니다.
            취약점을 볼 때는 무엇인지보다 왜 그렇게 터졌는지를 먼저 봅니다.
          </p>
          <Link className="hero-link r3" href="/projects">작업 보기</Link>
        </div>
        <dl className="ledger r4">
          <div className="row"><dt>분류</dt><dd>시스템 해킹, 리버싱</dd></div>
          <div className="row"><dt>범위</dt><dd>리눅스 유저랜드, npm 공급망, LLM</dd></div>
          <div className="row"><dt>소속</dt><dd>중부대학교 정보보호학전공</dd></div>
          <div className="row"><dt>상태</dt><dd className="num">2025.03 — 재학 중</dd></div>
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
              <Link href={`/projects/${p.slug}`} transitionTypes={['nav-forward']} className="case-visual" aria-label={`${p.title} 자세히 보기`}>
                <SharedVisual slug={p.slug}><Visual kind={p.visual} /></SharedVisual>
              </Link>
              <div>
                <h3><Link href={`/projects/${p.slug}`} transitionTypes={['nav-forward']}>{p.title}</Link></h3>
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
          <p className="note num">2025 — 현재</p>
        </div>
        <div className="about-grid">
          <h2>무엇인지보다<br />왜 터졌는지를 먼저</h2>
          <div>
            <p>고등학생 때 파이썬과 C로 프로그래밍을 시작하며 코드가 안에서 어떻게 흘러가는지에 관심을 갖게 됐습니다. 대학에 와서는 리버싱으로 보안을 시작했고, 자연스럽게 시스템 해킹까지 왔습니다.</p>
            <p>sudo에서 새 취약점을 찾겠다고 덤볐다가 어디를 봐야 할지 몰라 막혔고, 그래서 과거 취약점이 왜 생겼는지부터 거꾸로 따라갔습니다. 그때 배운 순서를 지금도 씁니다. 요즘은 모델의 권한과 입력 신뢰 문제가 시스템 보안과 같은 구조라는 점에 끌려 LLM 보안을 공부하고 있습니다.</p>
            <dl className="caps">
              <div><dt>영역</dt><dd>리버싱, 시스템 해킹, 공급망 보안, LLM 보안</dd></div>
              <div><dt>도구</dt><dd className="num">OllyDbg, Docker, Semgrep, AWS</dd></div>
              <div><dt>언어</dt><dd className="num">C, Python</dd></div>
              <div><dt>발표</dt><dd>House of Spirit(S.C.P 세미나), 프롬프트 인젝션(오픈 세미나), 지뢰찾기 리버싱(명지대 합동 세미나)</dd></div>
              <div><dt>CTF</dt><dd>2025 JBU CTF 장려상 · 2025 CCE · 2025 세종 헥테온 · 2026 Inc0gnito · 2026 한양대</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <div className="band" style={{ marginTop: 110 }}>
        <section className="contact wrap">
          <h2>같이 파볼 문제가 있나요?</h2>
          <p className="sub">함께할 프로젝트나 스터디, 채용 관련 이야기라면 편하게 보내주세요.</p>
          <Link className="email" href="/contact">문의 보내기<ArrowUpRight /></Link>
        </section>
      </div>
    </PageTransition>
  )
}
