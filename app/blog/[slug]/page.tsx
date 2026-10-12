import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost, getPosts } from '@/lib/data'
import { renderMarkdown } from '@/lib/markdown'
import ViewCounter from '@/components/site/ViewCounter'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: '찾을 수 없음' }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
    },
  }
}

export async function generateStaticParams() {
  try {
    const items = await getPosts({ limit: 50 })
    return items.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export default async function PostDetail({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <article className="wrap detail" style={{ paddingTop: 72 }}>
      <p className="crumb"><Link href="/blog">← 기록 목록</Link></p>

      <header className="detail-head">
        <h1>{post.title}</h1>
        <dl className="detail-meta">
          <div>
            <dt>발행</dt>
            <dd className="num">
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ko-KR') : '초안'}
            </dd>
          </div>
          <div><dt>분량</dt><dd className="num">{post.readingMinutes}분</dd></div>
          <div><dt>조회</dt><dd><ViewCounter type="post" slug={post.slug} initial={post.views} /></dd></div>
        </dl>
        {post.tags.length > 0 && (
          <ul className="chips">
            {post.tags.map((t) => (
              <li key={t}><Link href={`/blog?tag=${encodeURIComponent(t)}`}>{t}</Link></li>
            ))}
          </ul>
        )}
      </header>

      <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
    </article>
  )
}
