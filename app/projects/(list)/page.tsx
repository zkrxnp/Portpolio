import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getProjects, getProjectFacets } from '@/lib/data'
import { projectQuery, firstValues } from '@/lib/validation'
import ProjectArt from '@/components/site/ProjectArt'
import SearchBar from '@/components/site/SearchBar'
import { PageTransition, SharedVisual } from '@/components/site/PageTransition'

export const metadata: Metadata = { title: '프로젝트' }
export const dynamic = 'force-dynamic'

const SORTS = [
  { value: 'featured', label: '기본순' },
  { value: 'latest', label: '최신순' },
  { value: 'name', label: '이름순' },
]

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // 잘못된 값이 URL에 들어와도 페이지는 기본값으로 보여줍니다(API는 같은 스키마로 422를 냅니다).
  const parsed = projectQuery.safeParse(firstValues(await searchParams))
  const query = parsed.success ? parsed.data : projectQuery.parse({})
  const [projects, facets] = await Promise.all([getProjects(query), getProjectFacets()])
  const filtered = Boolean(query.q || (query.category && query.category !== '전체') || query.tech || query.status)

  return (
    <PageTransition>
    <section className="wrap page">
      <header className="page-head">
        <h1>프로젝트</h1>
        <span className="sec-count num">{projects.length}개</span>
      </header>

      <SearchBar
        placeholder="제목, 요약, 기술 스택으로 검색"
        filters={facets.categories}
        activeFilter={query.category || '전체'}
        filterKey="category"
        initialQuery={query.q}
        selects={[
          {
            key: 'tech', label: '기술', value: query.tech,
            options: [{ value: '', label: '전체' }, ...facets.techs.map((t) => ({ value: t, label: t }))],
          },
          {
            key: 'status', label: '상태', value: query.status,
            options: [{ value: '', label: '전체' }, ...facets.statuses.map((s) => ({ value: s, label: s }))],
          },
          { key: 'sort', label: '정렬', value: query.sort, options: SORTS },
        ]}
      />

      {projects.length === 0 ? (
        <p className="empty">{filtered ? '조건에 맞는 작업이 없습니다.' : '준비 중'}</p>
      ) : (
        <ol className="proj-list">
          {projects.map((p, i) => (
            <li key={p._id}>
              <Link href={`/projects/${p.slug}`} transitionTypes={['nav-forward']} className="proj-row">
                <span className="proj-no num">{String(i + 1).padStart(2, '0')}</span>
                <div className="proj-thumb">
                  <SharedVisual slug={p.slug}><ProjectArt thumbnail={p.thumbnail} visual={p.visual} title={p.title} /></SharedVisual>
                </div>
                <div className="proj-main">
                  <p className="work-meta num">
                    <span className="status-tag" data-status={p.status}>{p.status}</span>
                    <span>{p.category}</span>
                    {p.period && <span>{p.period}</span>}
                    {p.role && <span>{p.role}</span>}
                  </p>
                  <h2>{p.title}</h2>
                  <p className="work-summary">{p.summary}</p>
                  {p.stack.length > 0 && (
                    <ul className="stack">{p.stack.map((s) => <li key={s} data-on={s.toLowerCase() === query.tech.toLowerCase() || undefined}>{s}</li>)}</ul>
                  )}
                </div>
                <ArrowUpRight className="work-arrow" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
    </PageTransition>
  )
}
