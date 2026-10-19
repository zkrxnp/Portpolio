import { type NextRequest } from 'next/server'
import { isValidObjectId } from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Guestbook from '@/lib/models/Guestbook'
import { ok, fail, handleError } from '@/lib/http'

export const dynamic = 'force-dynamic'

/** DELETE /api/admin/guestbook/:id — 인증은 미들웨어가 /api/admin/* 전체에서 검사합니다. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return fail('잘못된 식별자입니다.', 400)
    await dbConnect()
    const res = await Guestbook.findByIdAndDelete(id)
    if (!res) return fail('메시지를 찾을 수 없습니다.', 404)
    return ok({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
