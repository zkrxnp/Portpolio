import { type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import { ok, handleError } from '@/lib/http'
import type { FilterQuery } from 'mongoose'
import type { ProjectDoc } from '@/lib/models/Project'

export const dynamic = 'force-dynamic'

/** 공개 목록. 검색어·분야·페이지를 쿼리스트링으로 받습니다. */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = (sp.get('q') ?? '').trim()
    const category = sp.get('category') ?? ''
    const page = Math.max(1, Number(sp.get('page') ?? 1) || 1)
    const limit = Math.min(50, Math.max(1, Number(sp.get('limit') ?? 12) || 12))

    const filter: FilterQuery<ProjectDoc> = { published: true }
    if (category && category !== '전체') filter.category = category
    if (q) {
      // $text는 한글 부분일치가 약해서 정규식으로 받습니다. 사용자 입력은 이스케이프합니다.
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const rx = new RegExp(safe, 'i')
      filter.$or = [{ title: rx }, { summary: rx }, { stack: rx }]
    }

    await dbConnect()
    const [items, total] = await Promise.all([
      Project.find(filter)
        .select('-body')
        .sort({ featured: -1, order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ])

    return ok({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) })
  } catch (err) {
    return handleError(err)
  }
}
