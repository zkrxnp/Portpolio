import type { Metadata } from 'next'
import Link from 'next/link'
import { getPosts, getLogFacets } from '@/lib/data'
import { logQuery, firstValues } from '@/lib/validation'
import SearchBar from '@/components/site/SearchBar'

export const metadata: Metadata = { title: '기록' }
export const dynamic = 'force-dynamic'

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // 잘못된 값이 URL에 들어와도 페이지는 기본값으로 보여줍니다(API는 같은 스키마로 422를 냅니다).
  const parsed = logQuery.safeParse(firstValues(await searchParams))
  const query = parsed.success ? parsed.data : logQuery.parse({})
  const [posts, facets] = await Promise.all([getPosts(query), getLogFacets()])
  const filtered = Boolean(query.q || query.tag || (query.category && query.category !== '전체'))

  return (
    <section className="wrap page">
      <header className="page-head">
        <h1>기록</h1>
        <span className="sec-count num">{posts.length}개</span>
      </header>

      <SearchBar
        placeholder="제목, 요약, 태그로 검색"
        filters={facets.categories}
        activeFilter={query.category || '전체'}
        filterKey="category"
        initialQuery={query.q}
        selects={[
          {
            key: 'tag', label: '태그', value: query.tag,
            options: [{ value: '', label: '전체' }, ...facets.tags.map((t) => ({ value: t, label: t }))],
          },
          {
            key: 'sort', label: '정렬', value: query.sort,
            options: [{ value: 'newest', label: '최신순' }, { value: 'oldest', label: '오래된순' }],
          },
        ]}
      />

      {posts.length === 0 ? (
        <p className="empty">{filtered ? '조건에 맞는 기록이 없습니다.' : '준비 중'}</p>
      ) : (
        <ul className="notes notes-full">
          {posts.map((p) => (
            <li key={p._id}>
              <Link href={`/blog/${p.slug}`}>
                <span className="n-date num">
                  {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('ko-KR') : '초안'}
                  <em className="n-cat">{p.category}</em>
                </span>
                <span className="n-main">
                  <span className="n-title">{p.title}</span>
                  {p.excerpt && <span className="n-excerpt">{p.excerpt}</span>}
                </span>
                <span className="n-tags num">
                  {p.tags.length > 0 && <span>{p.tags.join(' / ')}</span>}
                  <span>{p.readingMinutes}분 · 조회 {p.views.toLocaleString('ko-KR')}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
