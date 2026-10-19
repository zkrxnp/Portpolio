import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProject, getProjects } from '@/lib/data'
import { renderMarkdown, textStats } from '@/lib/markdown'
import GraphView from '@/components/site/GraphView'
import StatusBar from '@/components/site/StatusBar'
import { toCaseStudy } from '@/lib/caseStudy'
import { VISUAL_CAPTIONS } from '@/components/site/Visual'
import ProjectArt from '@/components/site/ProjectArt'
import ViewCounter from '@/components/site/ViewCounter'
import { PageTransition, SharedVisual } from '@/components/site/PageTransition'

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

  // 본문 소제목에 OBJECTIVE / ANALYSIS / FINDINGS 라벨만 붙입니다. 내용은 그대로입니다.
  const blocks = project.body ? toCaseStudy(renderMarkdown(project.body)) : []
  const others = (await getProjects({ limit: 50 })).filter((p) => p.slug !== project.slug)
  const stats = textStats(project.body)

  return (
    <PageTransition>
    <article className="wrap detail">
      <p className="crumb"><Link href="/projects" transitionTypes={['nav-back']}>← 프로젝트 목록</Link></p>

      <header className="case-head">
        <p className="kicker num">{project.category}{project.period && ` / ${project.period}`}</p>
        <h1>{project.title}</h1>
        <p className="case-lead">{project.summary}</p>
        <dl className="case-meta">
          <div><dt>상태</dt><dd><span className="status-tag" data-status={project.status}>{project.status}</span></dd></div>
          <div><dt>분야</dt><dd>{project.category}</dd></div>
          {project.period && <div><dt>기간</dt><dd className="num">{project.period}</dd></div>}
          {project.role && <div><dt>역할</dt><dd>{project.role}</dd></div>}
          {project.links.repo && (
            <div><dt>GitHub</dt><dd><a className="link" href={project.links.repo} target="_blank" rel="noopener noreferrer">저장소 ↗</a></dd></div>
          )}
          {project.links.writeup && (
            <div><dt>글</dt><dd><a className="link" href={project.links.writeup} target="_blank" rel="noopener noreferrer">라이트업 ↗</a></dd></div>
          )}
          <div><dt>조회</dt><dd className="num"><ViewCounter type="project" slug={project.slug} initial={project.views} /></dd></div>
        </dl>
      </header>

      {(project.thumbnail || project.visual !== 'none') && (
        <figure className="case-fig">
          <div className="detail-visual"><SharedVisual slug={project.slug}><ProjectArt thumbnail={project.thumbnail} visual={project.visual} title={project.title} /></SharedVisual></div>
          {!project.thumbnail && VISUAL_CAPTIONS[project.visual] && (
            <figcaption className="fig-cap">{VISUAL_CAPTIONS[project.visual]}</figcaption>
          )}
        </figure>
      )}

      {(blocks.length > 0 || project.stack.length > 0) && (
        <div className="cs">
          {blocks.map((b, i) => (
            <section className="cs-block" key={i}>
              <p className="cs-label num">{b.label ?? ''}</p>
              <div className="prose" dangerouslySetInnerHTML={{ __html: b.html }} />
            </section>
          ))}
          {project.stack.length > 0 && (
            <section className="cs-block">
              <p className="cs-label num">STACK</p>
              <ul className="stack lg">{project.stack.map((s) => <li key={s}>{s}</li>)}</ul>
            </section>
          )}
        </div>
      )}

      {project.relatedLogs.length > 0 && (
        <section className="sec">
          <header className="sec-head">
            <span className="sec-no">←</span>
            <h2>백링크</h2>
            <span className="sec-count num">이 프로젝트에 연결된 기록 {project.relatedLogs.length}개</span>
          </header>
          <div className="links-panel">
          <GraphView
            className="graph local"
            projects={[{ _id: project._id, slug: project.slug, title: project.title }]}
            logs={project.relatedLogs.map((l) => ({ ...l, relatedProjectIds: [project._id] }))}
          />
          <ul className="notes">
            {project.relatedLogs.map((l) => (
              <li key={l.slug}>
                <Link href={`/blog/${l.slug}`}>
                  <span className="n-date num">{l.publishedAt ? new Date(l.publishedAt).toLocaleDateString('ko-KR') : ''}</span>
                  <span className="n-main"><span className="n-title">{l.title}</span></span>
                  <span className="n-tags num">{l.category}</span>
                </Link>
              </li>
            ))}
          </ul>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="sec">
          <header className="sec-head">
            <span className="sec-no">→</span>
            <h2>다른 프로젝트</h2>
          </header>
          <ul className="notes">
            {others.map((p) => (
              <li key={p._id}>
                <Link href={`/projects/${p.slug}`}>
                  <span className="n-date num">{p.category}</span>
                  <span className="n-main"><span className="n-title">{p.title}</span></span>
                  <span className="n-tags num">{p.period}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <StatusBar items={[`단어 ${stats.words.toLocaleString('ko-KR')}`, `글자 ${stats.chars.toLocaleString('ko-KR')}`, `백링크 ${project.relatedLogs.length}`]} />
    </article>
    </PageTransition>
  )
}
