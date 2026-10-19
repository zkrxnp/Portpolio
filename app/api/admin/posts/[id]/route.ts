import { type NextRequest } from 'next/server'
import { isValidObjectId } from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'
import { z } from 'zod'
import { postInput } from '@/lib/validation'
import { ok, fail, handleError, slugify } from '@/lib/http'
import { excerptFrom } from '@/lib/markdown'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return fail('잘못된 식별자입니다.', 400)
    await dbConnect()
    const item = await Post.findById(id).lean()
    if (!item) return fail('글을 찾을 수 없습니다.', 404)
    return ok({ item })
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return fail('잘못된 식별자입니다.', 400)
    const data = postInput.parse(await req.json())

    await dbConnect()
    const doc = await Post.findById(id)
    if (!doc) return fail('글을 찾을 수 없습니다.', 404)

    // findByIdAndUpdate는 pre('save')를 타지 않으므로 직접 넣고 save합니다.
    doc.set({
      ...data,
      // 기호뿐인 제목이면 빈 슬러그가 됩니다. 수정 한 번에 공개 URL이 바뀌지 않도록 기존 값을 둡니다.
      slug: slugify(data.slug || data.title) || doc.slug,
      excerpt: data.excerpt || excerptFrom(data.body),
    })
    await doc.save()

    return ok({ item: doc.toObject() })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return fail('잘못된 식별자입니다.', 400)
    await dbConnect()
    const res = await Post.findByIdAndDelete(id)
    if (!res) return fail('글을 찾을 수 없습니다.', 404)
    return ok({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}

/** PATCH — 공개 여부만 바꿉니다. save()를 거쳐야 발행일이 pre('save')에서 채워집니다. */
const patchInput = z.object({ published: z.boolean() }).strict()

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return fail('잘못된 식별자입니다.', 400)
    const { published } = patchInput.parse(await req.json())
    await dbConnect()
    const doc = await Post.findById(id)
    if (!doc) return fail('글을 찾을 수 없습니다.', 404)
    doc.set({ published })
    await doc.save()
    return ok({ item: { _id: String(doc._id), published: doc.published, publishedAt: doc.publishedAt } })
  } catch (err) {
    return handleError(err)
  }
}
