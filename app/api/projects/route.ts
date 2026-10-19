import { type NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/http'
import { queryProjects, toProjectDTO } from '@/lib/data'
import { projectQuery, firstValues } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/**
 * GET /api/projects — 공개 목록.
 * q(제목·요약·기술 검색) · category · tech · status · sort(featured|latest|name) · page · limit
 * 잘못된 값(없는 정렬 키, 범위 밖 페이지 등)은 422로 거절합니다.
 */
export async function GET(req: NextRequest) {
  try {
    const q = projectQuery.parse(firstValues(req.nextUrl.searchParams))
    const res = await queryProjects(q)
    return ok({ ...res, items: res.items.map(toProjectDTO) })
  } catch (err) {
    return handleError(err)
  }
}
