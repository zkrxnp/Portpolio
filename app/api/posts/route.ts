import { type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Post, { type PostDoc } from '@/lib/models/Post'
import { ok, handleError } from '@/lib/http'
import type { FilterQuery } from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = (sp.get('q') ?? '').trim()
    const tag = sp.get('tag') ?? ''
    const page = Math.max(1, Number(sp.get('page') ?? 1) || 1)
    const limit = Math.min(50, Math.max(1, Number(sp.get('limit') ?? 10) || 10))

    const filter: FilterQuery<PostDoc> = { published: true }
    if (tag) filter.tags = tag
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const rx = new RegExp(safe, 'i')
      filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }]
    }

    await dbConnect()
    const [items, total] = await Promise.all([
      Post.find(filter).select('-body').sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Post.countDocuments(filter),
    ])

    return ok({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) })
  } catch (err) {
    return handleError(err)
  }
}
