import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { getProject, getProjects } from '@/lib/data'
import { renderMarkdown } from '@/lib/markdown'
import Visual from '@/components/site/Visual'
import ViewCounter from '@/components/site/ViewCounter'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return { title: '찾을 수 없음' }
  return {
    title: project.title,
    description: project.summary,
    openGraph: { title: project.title, description: project.summary, type: 'article' },
  }
}

export async function generateStaticParams() {
  try {
    const items = await getProjects({ limit: 50 })
    return items.map((p) => ({ slug: p.slug }))
  } catch {
    // 빌드 시점에 DB가 없어도 빌드는 통과해야 합니다.
    return []
  }
}

export default async function ProjectDetail({ params }: Props) {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) notFound()

  const html = project.body ? renderMarkdown(project.body) : ''

  return (
    <article className="wrap detail" style={{ paddingTop: 72 }}>
      <p className="crumb"><Link href="/projects">← 작업 목록</Link></p>

      <header className="detail-head">
        <h1>{project.title}</h1>
        <p className="detail-sub">{project.summary}</p>
        <dl className="detail-meta">
          <div><dt>분야</dt><dd>{project.category}</dd></div>
          {project.period && <div><dt>기간</dt><dd className="num">{project.period}</dd></div>}
          {project.role && <div><dt>역할</dt><dd>{project.role}</dd></div>}
          <div><dt>조회</dt><dd><ViewCounter type="project" slug={project.slug} initial={project.views} /></dd></div>
        </dl>
      </header>

      {project.visual !== 'none' && (
        <div className="detail-visual"><Visual kind={project.visual} /></div>
      )}

      {project.stack.length > 0 && (
        <ul className="chips">{project.stack.map((s) => <li key={s}>{s}</li>)}</ul>
      )}

      {html ? (
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="empty">상세 내용이 아직 작성되지 않았습니다.</p>
      )}

      <div className="band" style={{ marginTop: 80 }}>
        <section className="contact wrap">
          <h2>비슷한 작업이 필요하신가요?</h2>
          <Link className="email" href="/contact">문의 보내기<ArrowUpRight /></Link>
        </section>
      </div>
    </article>
  )
}
