import { ok, handleError } from '@/lib/http'
import { loadVault } from '@/lib/vault'

export const dynamic = 'force-dynamic'

/** GET /api/notes — 작업 공간의 노트 목록(탐색기 트리용 메타데이터). */
export async function GET() {
  try {
    const v = await loadVault()
    return ok({ items: v.notes })
  } catch (err) {
    return handleError(err)
  }
}
