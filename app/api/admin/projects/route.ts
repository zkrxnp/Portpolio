import { type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import { projectInput } from '@/lib/validation'
import { ok, handleError, slugify } from '@/lib/http'

export const dynamic = 'force-dynamic'

/** 관리자 목록은 미공개 항목까지 전부 보여줍니다. */
export async function GET() {
  try {
    await dbConnect()
    const items = await Project.find({}).select('-body').sort({ featured: -1, order: 1, createdAt: -1 }).lean()
    return ok({ items })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = projectInput.parse(await req.json())
    await dbConnect()
    const created = await Project.create({
      ...data,
      slug: slugify(data.slug || data.title) || `project-${Date.now()}`,
    })
    return ok({ item: created.toObject() }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
