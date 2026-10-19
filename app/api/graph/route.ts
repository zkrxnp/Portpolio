import { ok, handleError } from '@/lib/http'
import { loadVault, toGraph } from '@/lib/vault'

export const dynamic = 'force-dynamic'

/** GET /api/graph — 노드(노트)와 연결선(등록된 관계). */
export async function GET() {
  try {
    return ok(toGraph(await loadVault()))
  } catch (err) {
    return handleError(err)
  }
}
