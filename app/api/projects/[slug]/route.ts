import { type NextRequest } from 'next/server'
import { ok, fail, handleError } from '@/lib/http'
import { findProject, toProjectDTO } from '@/lib/data'

export const dynamic = 'force-dynamic'

/** GET /api/projects/:slug — 공개된 프로젝트 하나와 연결된 Research Log. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    if (slug.length > 160) return fail('프로젝트를 찾을 수 없습니다.', 404)
    const item = await findProject(slug)
    if (!item) return fail('프로젝트를 찾을 수 없습니다.', 404)
    return ok({ item: toProjectDTO(item) })
  } catch (err) {
    return handleError(err)
  }
}
