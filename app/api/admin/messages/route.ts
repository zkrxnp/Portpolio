import { type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Message, { MESSAGE_STATUSES, type MessageDoc } from '@/lib/models/Message'
import { ok, handleError } from '@/lib/http'
import type { FilterQuery } from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status') ?? ''
    const filter: FilterQuery<MessageDoc> = {}
    if ((MESSAGE_STATUSES as readonly string[]).includes(status)) filter.status = status

    await dbConnect()
    const [items, counts] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
      Message.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    ])

    return ok({
      items,
      counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
    })
  } catch (err) {
    return handleError(err)
  }
}
