import { type NextRequest } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Message, { MESSAGE_STATUSES } from '@/lib/models/Message'
import { ok, fail, handleError } from '@/lib/http'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }
const patchInput = z.object({ status: z.enum(MESSAGE_STATUSES) })

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return fail('잘못된 식별자입니다.', 400)
    const { status } = patchInput.parse(await req.json())

    await dbConnect()
    const item = await Message.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean()
    if (!item) return fail('문의를 찾을 수 없습니다.', 404)
    return ok({ item })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return fail('잘못된 식별자입니다.', 400)
    await dbConnect()
    const res = await Message.findByIdAndDelete(id)
    if (!res) return fail('문의를 찾을 수 없습니다.', 404)
    return ok({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
