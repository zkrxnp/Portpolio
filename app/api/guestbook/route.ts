import { type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Guestbook from '@/lib/models/Guestbook'
import { takeHit } from '@/lib/models/RateHit'
import { ok, fail, handleError } from '@/lib/http'
import { queryGuestbook } from '@/lib/data'
import { guestbookInput, guestbookQuery, firstValues } from '@/lib/validation'
import { clientIp, hashIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const MAX_BODY = 4 * 1024 // 이름 40자 + 메시지 500자에 넉넉한 여유
const WINDOW = 10 * 60 * 1000

/** GET /api/guestbook?page=&limit= — 최신순. */
export async function GET(req: NextRequest) {
  try {
    const { page, limit } = guestbookQuery.parse(firstValues(req.nextUrl.searchParams))
    return ok(await queryGuestbook(page, limit))
  } catch (err) {
    return handleError(err)
  }
}

/**
 * POST /api/guestbook — 로그인 없이 쓰는 공개 경로라 방어를 겹쳐 둡니다.
 *  1. 크기 제한(4KB)과 JSON만 허용
 *  2. zod 검증: 공백만 있는 입력·보이지 않는 문자 제거 후 길이 검사
 *  3. 허니팟
 *  4. 요청 제한: 발신지별 10분에 3건, 전체 10분에 60건(IP를 바꿔가며 도배하는 경우 대비)
 * 저장은 평문 텍스트. 화면에서는 React가 이스케이프하므로 HTML·스크립트가 실행되지 않습니다.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
      return fail('JSON으로 보내주세요.', 415)
    }
    if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) return fail('요청이 너무 큽니다.', 413)
    const raw = await req.text()
    if (raw.length > MAX_BODY) return fail('요청이 너무 큽니다.', 413)

    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      return fail('요청 형식이 올바르지 않습니다.', 400)
    }

    const data = guestbookInput.parse(json)
    if (data.website) return ok({ ok: true }, { status: 201 })

    await dbConnect()
    for (const [key, max] of [[`gb:${hashIp(clientIp(req.headers))}`, 3], ['gb:all', 60]] as const) {
      const r = await takeHit(key, WINDOW, max)
      if (!r.ok) {
        return fail('잠시 뒤에 다시 남겨주세요.', 429, { retryAfter: r.retryAfterSec })
      }
    }

    const doc = await Guestbook.create({ name: data.name, message: data.message })
    return ok(
      { item: { _id: String(doc._id), name: doc.name, message: doc.message, createdAt: doc.createdAt.toISOString() } },
      { status: 201 },
    )
  } catch (err) {
    return handleError(err)
  }
}
