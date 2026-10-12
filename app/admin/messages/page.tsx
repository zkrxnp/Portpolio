import dbConnect from '@/lib/mongodb'
import Message from '@/lib/models/Message'
import MessageList from '@/components/admin/MessageList'

export const dynamic = 'force-dynamic'

export default async function AdminMessages() {
  await dbConnect()
  const docs = await Message.find({}).sort({ createdAt: -1 }).limit(200).lean()

  const items = docs.map((m) => ({
    _id: String(m._id),
    name: m.name,
    email: m.email,
    org: m.org ?? '',
    kind: m.kind ?? '기타',
    body: m.body,
    status: m.status ?? 'new',
    createdAt: new Date(m.createdAt as unknown as string).toISOString(),
  }))

  return (
    <>
      <h1 className="admin-title">문의</h1>
      <MessageList items={items} />
    </>
  )
}
