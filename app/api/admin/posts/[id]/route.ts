import { type NextRequest } from 'next/server'
import { isValidObjectId } from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'
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
      slug: slugify(data.slug || data.title),
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
