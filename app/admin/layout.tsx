import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import AdminNav from '@/components/admin/AdminNav'

export const metadata: Metadata = { title: '관리', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 미들웨어가 이미 막지만, 레이아웃에서도 확인해 이름을 띄웁니다.
  const session = await getSession()

  return (
    <div className="admin wrap">
      {session && <AdminNav name={session.name} login={session.login} />}
      {children}
    </div>
  )
}
