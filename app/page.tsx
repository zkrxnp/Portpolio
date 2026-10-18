import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getProjects, getPosts } from '@/lib/data'
import { activities } from '@/lib/activities'
import Visual from '@/components/site/Visual'
import SectionNav from '@/components/site/SectionNav'
import { PageTransition, SharedVisual } from '@/components/site/PageTransition'

export const revalidate = 60

const STAT_KINDS = ['프로젝트', '발표', 'CTF', '수상'] as const
const stats = STAT_KINDS.map((k) => ({ label: k, n: activities.filter((a) => a.kind === k).length }))

export default async function HomePage() {
  const [projects, posts] = await Promise.all([
    getProjects({ limit: 3 }),
    getPosts({ limit: 3 }),
  ])

  const sections = [
    { id: 'about', label: '소개' },
    { id: 'activities', label: '활동' },
    ...(projects.length > 0 ? [{ id: 'projects', label: '작업' }] : []),
    ...(posts.length > 0 ? [{ id: 'notes', label: '기록' }] : []),
  ]

  return (
    <PageTransition>
      <h1 className="sr-only">정현진 — 보안 포트폴리오</h1>

      {/* 2단: 왼쪽은 고정, 오른쪽만 스크롤 (참고: brittanychiang.com) */}
      <div className="split wrap">
        <aside className="split-side">
          <div className="hero-visual r1"><Visual kind="hex" /></div>
          <dl className="ledger r4">
            <div className="row"><dt>분류</dt><dd>시스템 해킹, 리버싱</dd></div>
            <div className="row"><dt>범위</dt><dd>리눅스 유저랜드, npm 공급망, LLM</dd></div>
            <div className="row"><dt>소속</dt><dd>중부대학교 정보보호학전공</dd></div>
            <div className="row"><dt>상태</dt><dd className="num">2025.03 — 재학 중</dd></div>
          </dl>
          <SectionNav items={sections} />
        </aside>

        <div className="split-main">
          <section id="about">
            <div className="section-head">
              <h2>소개</h2>
              <p className="note num">2025 — 현재</p>
            </div>
            <div className="about-grid">
              <dl className="stats">
                {stats.map((s) => (
                  <div key={s.label}><dt>{s.label}</dt><dd className="num">{s.n}</dd></div>
                ))}
              </dl>
              <div>
                <dl className="caps">
                  <div><dt>영역</dt><dd>리버싱, 시스템 해킹, 공급망 보안, LLM 보안</dd></div>
                  <div><dt>도구</dt><dd className="num">OllyDbg, Docker, Semgrep, AWS</dd></div>
                  <div><dt>언어</dt><dd className="num">C, Python</dd></div>
                </dl>
              </div>
            </div>
          </section>

          <section id="activities">
            <div className="section-head">
              <h2>활동</h2>
              <p className="note num">{activities.length} records</p>
            </div>
            <ol className="timeline">
              {activities.map((a) => (
                <li key={a.date + a.title}>
                  <span className="tl-date num">{a.date || '—'}</span>
                  <span className="tl-kind">{a.kind}</span>
                  <span className="tl-body">
                    {a.href ? <Link href={a.href}>{a.title}</Link> : a.title}
                    {a.detail && <small>{a.detail}</small>}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {projects.length > 0 && (
            <section id="projects">
              <div className="section-head">
                <h2>작업</h2>
                <Link className="note link" href="/projects">전체 보기 →</Link>
              </div>
              {projects.map((p) => (
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
                    {p.stack.length > 0 && (
                      <ul className="chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}

          {posts.length > 0 && (
            <section id="notes">
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
        </div>
      </div>

      <div className="band" style={{ marginTop: 110 }}>
        <section className="contact wrap">
          <h2><a href="mailto:cookcoo150@naver.com">cookcoo150@naver.com</a></h2>
          <Link className="email" href="/contact">문의 보내기<ArrowUpRight /></Link>
        </section>
      </div>
    </PageTransition>
  )
}
