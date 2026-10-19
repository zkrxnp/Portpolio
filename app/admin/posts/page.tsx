import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'
import RowActions from '@/components/admin/RowActions'
import PublishToggle from '@/components/admin/PublishToggle'

export const dynamic = 'force-dynamic'

export default async function AdminPosts() {
  await dbConnect()
  const items = await Post.find({}).select('-body').sort({ createdAt: -1 }).lean()

  return (
    <>
      <div className="admin-head">
        <h1 className="admin-title">기록</h1>
        <Link className="btn" href="/admin/posts/new">쓰기</Link>
      </div>

      {items.length === 0 ? (
        <p className="empty">아직 글이 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>제목</th><th>분류 · 태그</th><th>공개</th><th className="ta-r">조회</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={String(p._id)}>
                <td>
                  <Link href={`/admin/posts/${p._id}`}>{p.title}</Link>
                  <small className="slug num">
                    /{p.slug}
                    {p.publishedAt && ` · ${new Date(p.publishedAt).toLocaleDateString('ko-KR')}`}
                  </small>
                </td>
                <td>{p.category ?? '기타'}<small className="slug">{(p.tags ?? []).join(', ') || '—'}</small></td>
                <td><PublishToggle id={String(p._id)} published={Boolean(p.published)} /></td>
                <td className="ta-r num">{(p.views ?? 0).toLocaleString('ko-KR')}</td>
                <td className="ta-r"><RowActions endpoint={`/api/admin/posts/${p._id}`} label={p.title} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
