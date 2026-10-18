import type { Metadata } from 'next'
import Link from 'next/link'
import { getPosts, getTags } from '@/lib/data'
import SearchBar from '@/components/site/SearchBar'
import { firstParam } from '@/lib/http'

export const metadata: Metadata = { title: '기록' }
export const dynamic = 'force-dynamic'

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; tag?: string | string[] }>
}) {
  const sp = await searchParams
  const q = firstParam(sp.q) ?? ''
  const tag = firstParam(sp.tag) ?? ''
  const [posts, tags] = await Promise.all([getPosts({ q, tag }), getTags()])

  return (
    <section className="wrap" style={{ paddingTop: 72 }}>
      <div className="section-head">
        <h2>기록</h2>
        <p className="note num">{posts.length > 0 ? `${posts.length} notes` : 'no notes'}</p>
      </div>

      <SearchBar
        placeholder="제목, 요약, 태그로 검색"
        filters={['전체', ...tags]}
        activeFilter={tag || '전체'}
        filterKey="tag"
        initialQuery={q}
      />

      {posts.length === 0 ? (
        <p className="empty">
          {q || tag ? '결과 없음' : '준비 중'}
        </p>
      ) : (
        <ul className="post-list">
          {posts.map((p) => (
            <li key={p._id}>
              <Link href={`/blog/${p.slug}`}>
                <h3>{p.title}</h3>
                {p.excerpt && <p>{p.excerpt}</p>}
                <div className="post-meta">
                  <span className="num">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('ko-KR') : '초안'}
                  </span>
                  <span className="num">{p.readingMinutes}분</span>
                  <span className="num">조회 {p.views.toLocaleString('ko-KR')}</span>
                  {p.tags.length > 0 && <span className="post-tags">{p.tags.join(' · ')}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
