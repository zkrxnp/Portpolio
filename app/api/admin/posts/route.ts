import { type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'
import { postInput } from '@/lib/validation'
import { ok, handleError, slugify } from '@/lib/http'
import { excerptFrom } from '@/lib/markdown'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await dbConnect()
    const items = await Post.find({}).select('-body').sort({ createdAt: -1 }).lean()
    return ok({ items })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = postInput.parse(await req.json())
    await dbConnect()
    // create()를 써야 pre('save')가 돌아 발행일·읽는 시간이 채워집니다.
    const created = await Post.create({
      ...data,
      slug: slugify(data.slug || data.title) || `post-${Date.now()}`,
      excerpt: data.excerpt || excerptFrom(data.body),
    })
    return ok({ item: created.toObject() }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
