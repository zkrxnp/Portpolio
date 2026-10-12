import { type NextRequest } from 'next/server'
import { isValidObjectId } from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import { projectInput } from '@/lib/validation'
import { ok, fail, handleError, slugify } from '@/lib/http'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return fail('잘못된 식별자입니다.', 400)
    await dbConnect()
    const item = await Project.findById(id).lean()
    if (!item) return fail('프로젝트를 찾을 수 없습니다.', 404)
    return ok({ item })
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return fail('잘못된 식별자입니다.', 400)
    const data = projectInput.parse(await req.json())
    await dbConnect()
    const item = await Project.findByIdAndUpdate(
      id,
      { ...data, slug: slugify(data.slug || data.title) },
      { new: true, runValidators: true },
    ).lean()
    if (!item) return fail('프로젝트를 찾을 수 없습니다.', 404)
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
    const res = await Project.findByIdAndDelete(id)
    if (!res) return fail('프로젝트를 찾을 수 없습니다.', 404)
    return ok({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
