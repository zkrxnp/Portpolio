import { type NextRequest } from 'next/server'
import { ok, fail, handleError } from '@/lib/http'
import { findLog, toLogDTO } from '@/lib/data'

export const dynamic = 'force-dynamic'

/** GET /api/research-logs/:slug — 공개 기록 하나. 비공개면 존재 여부도 드러내지 않고 404. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    if (slug.length > 200) return fail('기록을 찾을 수 없습니다.', 404)
    const item = await findLog(slug)
    if (!item) return fail('기록을 찾을 수 없습니다.', 404)
    return ok({ item: toLogDTO(item) })
  } catch (err) {
    return handleError(err)
  }
}
