import type { Metadata } from 'next'
import Link from 'next/link'
import { getProjects, getCategories } from '@/lib/data'
import Visual from '@/components/site/Visual'
import SearchBar from '@/components/site/SearchBar'
import { PageTransition, SharedVisual } from '@/components/site/PageTransition'
import { firstParam } from '@/lib/http'

export const metadata: Metadata = { title: '작업' }
export const dynamic = 'force-dynamic'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; category?: string | string[] }>
}) {
  const sp = await searchParams
  const q = firstParam(sp.q) ?? ''
  const category = firstParam(sp.category) ?? '전체'
  const [projects, categories] = await Promise.all([
    getProjects({ q, category }),
    getCategories(),
  ])

  return (
    <PageTransition>
    <section className="wrap" style={{ paddingTop: 72 }}>
      <div className="section-head">
        <h2>작업</h2>
        <p className="note num">
          {projects.length > 0 ? `${projects.length} cases` : 'no cases'}
        </p>
      </div>

      <SearchBar
        placeholder="제목, 요약, 기술 스택으로 검색"
        filters={categories}
        activeFilter={category}
        filterKey="category"
        initialQuery={q}
      />

      {projects.length === 0 ? (
        <p className="empty">
          {q || category !== '전체'
            ? '조건에 맞는 작업이 없습니다. 검색어를 지우거나 다른 분야를 눌러보세요.'
            : '아직 등록된 작업이 없습니다.'}
        </p>
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
              {p.stack.length > 0 && (
                <ul className="chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
              )}
            </div>
          </article>
        ))
      )}
    </section>
    </PageTransition>
  )
}
