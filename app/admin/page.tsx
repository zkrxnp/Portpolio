import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import Post from '@/lib/models/Post'
import Message from '@/lib/models/Message'
import Guestbook from '@/lib/models/Guestbook'

export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  await dbConnect()

  const [projects, drafts, posts, postDrafts, newMessages, top, viewAgg, guestbook] = await Promise.all([
    Project.countDocuments({ published: true }),
    Project.countDocuments({ published: false }),
    Post.countDocuments({ published: true }),
    Post.countDocuments({ published: false }),
    Message.countDocuments({ status: 'new' }),
    Project.find({ published: true }).select('title slug views').sort({ views: -1 }).limit(5).lean(),
    Project.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: '$views' } } }]),
    Guestbook.countDocuments({}),
  ])

  const stats = [
    { label: '공개 프로젝트', value: projects, sub: drafts ? `초안 ${drafts}` : '초안 없음', href: '/admin/projects' },
    { label: '공개 기록', value: posts, sub: postDrafts ? `비공개 ${postDrafts}` : '비공개 없음', href: '/admin/posts' },
    { label: '방명록', value: guestbook, sub: '전체 메시지', href: '/admin/guestbook' },
    { label: '읽지 않은 문의', value: newMessages, sub: newMessages ? '확인이 필요합니다' : '모두 확인함', href: '/admin/messages' },
    { label: '누적 조회', value: viewAgg[0]?.total ?? 0, sub: '프로젝트 합계', href: '/admin/projects' },
  ]

  return (
    <>
      <h1 className="admin-title">개요</h1>

      <div className="stat-row">
        {stats.map((s) => (
          <Link className="stat" key={s.label} href={s.href}>
            <span className="stat-label">{s.label}</span>
            <strong className="stat-value num">{s.value.toLocaleString('ko-KR')}</strong>
            <span className="stat-sub">{s.sub}</span>
          </Link>
        ))}
      </div>

      <section className="panel">
        <h2>많이 본 프로젝트</h2>
        {top.length === 0 ? (
          <p className="empty">아직 조회 기록이 없습니다.</p>
        ) : (
          <ol className="rank">
            {top.map((p, i) => (
              <li key={String(p._id)}>
                <span className="rank-n num">{String(i + 1).padStart(2, '0')}</span>
                <Link href={`/projects/${p.slug}`}>{p.title}</Link>
                <span className="rank-v num">{(p.views ?? 0).toLocaleString('ko-KR')}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="panel">
        <h2>바로 하기</h2>
        <div className="quick">
          <Link className="btn" href="/admin/projects/new">프로젝트 추가</Link>
          <Link className="btn ghost" href="/admin/posts/new">글 쓰기</Link>
          <Link className="btn ghost" href="/" target="_blank">사이트 보기</Link>
        </div>
      </section>
    </>
  )
}
