import { type NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/http'
import { queryLogs, toLogDTO } from '@/lib/data'
import { logQuery, firstValues } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/**
 * GET /api/research-logs — 공개 기록 목록.
 * q · tag · category · sort(newest|oldest) · page · limit. 비공개 기록은 어떤 조건에서도 나오지 않습니다.
 */
export async function GET(req: NextRequest) {
  try {
    const q = logQuery.parse(firstValues(req.nextUrl.searchParams))
    const res = await queryLogs(q)
    return ok({ ...res, items: res.items.map(toLogDTO) })
  } catch (err) {
    return handleError(err)
  }
}
