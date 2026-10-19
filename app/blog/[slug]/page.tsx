import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost, getPosts } from '@/lib/data'
import { renderMarkdown, withHeadingIds, textStats } from '@/lib/markdown'
import ViewCounter from '@/components/site/ViewCounter'
import Outline from '@/components/site/Outline'
import GraphView from '@/components/site/GraphView'
import StatusBar from '@/components/site/StatusBar'

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

  const { html, headings } = withHeadingIds(renderMarkdown(post.body))
  const stats = textStats(post.body)

  return (
    <article className="wrap detail">
      <p className="crumb"><Link href="/blog">← 기록 목록</Link></p>

      <header className="case-head">
        <p className="kicker num">{post.category}</p>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="case-lead">{post.excerpt}</p>}
        <dl className="case-meta">
          <div>
            <dt>발행</dt>
            <dd className="num">
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ko-KR') : '초안'}
            </dd>
          </div>
          <div><dt>분량</dt><dd className="num">{post.readingMinutes}분</dd></div>
          <div><dt>조회</dt><dd className="num"><ViewCounter type="post" slug={post.slug} initial={post.views} /></dd></div>
        </dl>
        {post.tags.length > 0 && (
          <ul className="chips">
            {post.tags.map((t) => (
              <li key={t}><Link href={`/blog?tag=${encodeURIComponent(t)}`}>{t}</Link></li>
            ))}
          </ul>
        )}
      </header>

      {/* 왼쪽 개요 패널 + 본문 (옵시디언 Outline) */}
      <div className="note-layout">
        <aside className="note-side"><Outline headings={headings} /></aside>
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {post.relatedProjects.length > 0 && (
        <section className="sec">
          <header className="sec-head">
            <span className="sec-no">→</span>
            <h2>연결된 프로젝트</h2>
          </header>
          <div className="links-panel">
          <GraphView
            className="graph local"
            projects={post.relatedProjects}
            logs={[{ slug: post.slug, title: post.title, relatedProjectIds: post.relatedProjects.map((p) => p._id) }]}
          />
          <ul className="notes">
            {post.relatedProjects.map((p) => (
              <li key={p.slug}>
                <Link href={`/projects/${p.slug}`}>
                  <span className="n-date num">{p.category}</span>
                  <span className="n-main"><span className="n-title">{p.title}</span></span>
                  <span className="n-tags num">프로젝트 →</span>
                </Link>
              </li>
            ))}
          </ul>
          </div>
        </section>
      )}

      <StatusBar items={[`단어 ${stats.words.toLocaleString('ko-KR')}`, `글자 ${stats.chars.toLocaleString('ko-KR')}`, `연결 ${post.relatedProjects.length}`]} />
    </article>
  )
}
