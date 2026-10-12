import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import RowActions from '@/components/admin/RowActions'

export const dynamic = 'force-dynamic'

export default async function AdminProjects() {
  await dbConnect()
  const items = await Project.find({}).select('-body').sort({ featured: -1, order: 1, createdAt: -1 }).lean()

  return (
    <>
      <div className="admin-head">
        <h1 className="admin-title">프로젝트</h1>
        <Link className="btn" href="/admin/projects/new">추가</Link>
      </div>

      {items.length === 0 ? (
        <p className="empty">아직 프로젝트가 없습니다. 「추가」를 눌러 첫 항목을 만드세요.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>제목</th><th>분야</th><th>상태</th><th className="ta-r">조회</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={String(p._id)}>
                <td>
                  <Link href={`/admin/projects/${p._id}`}>{p.title}</Link>
                  {p.featured && <span className="tag">고정</span>}
                  <small className="slug num">/{p.slug}</small>
                </td>
                <td>{p.category}</td>
                <td>
                  <span className={p.published ? 'pill on' : 'pill'}>{p.published ? '공개' : '초안'}</span>
                </td>
                <td className="ta-r num">{(p.views ?? 0).toLocaleString('ko-KR')}</td>
                <td className="ta-r">
                  <RowActions endpoint={`/api/admin/projects/${p._id}`} label={p.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
