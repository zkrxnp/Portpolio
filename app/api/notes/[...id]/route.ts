import { type NextRequest } from 'next/server'
import { ok, fail, handleError } from '@/lib/http'
import { getNoteDetail, parseNoteId } from '@/lib/vault'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notes/<종류>/<이름>            노트 하나 (본문 HTML, 속성, 백링크 포함)
 * GET /api/notes/<종류>/<이름>/backlinks  백링크·나가는 링크만
 * 예: /api/notes/project/trustgate, /api/notes/log/nexa-uncrackable1/backlinks
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string[] }> }) {
  try {
    const seg = (await params).id
    const wantsBacklinks = seg.length === 3 && seg[2] === 'backlinks'
    if (seg.length !== 2 && !wantsBacklinks) return fail('노트를 찾을 수 없습니다.', 404)
    const id = parseNoteId(`${seg[0]}:${seg[1]}`)
    if (!id) return fail('노트를 찾을 수 없습니다.', 404)

    const note = await getNoteDetail(id)
    if (!note) return fail('노트를 찾을 수 없습니다.', 404)
    if (wantsBacklinks) {
      return ok({ id: note.id, backlinks: note.backlinks, outgoing: note.outgoing, relatedProjects: note.relatedProjects, tags: note.tagRefs })
    }
    return ok({ item: note })
  } catch (err) {
    return handleError(err)
  }
}
