import Link from 'next/link'
import { queryGuestbook } from '@/lib/data'
import { guestbookQuery, firstValues } from '@/lib/validation'
import RowActions from '@/components/admin/RowActions'

export const dynamic = 'force-dynamic'

export default async function AdminGuestbook({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const parsed = guestbookQuery.safeParse({ ...firstValues(await searchParams), limit: 20 })
  const page = parsed.success ? parsed.data.page : 1
  const data = await queryGuestbook(page, 20)

  return (
    <>
      <div className="admin-head">
        <h1 className="admin-title">방명록</h1>
        <span className="pill num">{data.total.toLocaleString('ko-KR')}건</span>
      </div>

      {data.items.length === 0 ? (
        <p className="empty">아직 메시지가 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>이름</th><th>메시지</th><th>작성</th><th></th></tr>
          </thead>
          <tbody>
            {data.items.map((e) => (
              <tr key={e._id}>
                <td>{e.name}</td>
                <td className="msg-text">{e.message}</td>
                <td className="num">{new Date(e.createdAt).toLocaleString('ko-KR')}</td>
                <td className="ta-r"><RowActions endpoint={`/api/admin/guestbook/${e._id}`} label={e.name} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data.pages > 1 && (
        <nav className="pager num" aria-label="페이지">
          {page > 1 ? <Link href={`?page=${page - 1}`}>← 최신</Link> : <span />}
          <span>{page} / {data.pages}</span>
          {page < data.pages ? <Link href={`?page=${page + 1}`}>이전 →</Link> : <span />}
        </nav>
      )}
    </>
  )
}
