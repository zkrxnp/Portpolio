import { type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import Post from '@/lib/models/Post'
import { ok, fail, handleError } from '@/lib/http'

export const dynamic = 'force-dynamic'

/**
 * 조회수는 클라이언트가 한 번 호출합니다. 서버 렌더 중에 올리면
 * 프리페치나 봇 크롤링까지 세어버려 숫자가 금방 의미를 잃습니다.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  try {
    const { type, slug } = await params
    if (type !== 'project' && type !== 'post') return fail('알 수 없는 대상입니다.', 400)

    await dbConnect()

    // 두 모델을 변수 하나에 담으면 메서드 시그니처가 합쳐져 호출이 막히므로 분기합니다.
    const query = { slug, published: true }
    const update = { $inc: { views: 1 } }
    const opts = { new: true, projection: { views: 1 } }

    const doc =
      type === 'project'
        ? await Project.findOneAndUpdate(query, update, opts).lean<{ views: number } | null>()
        : await Post.findOneAndUpdate(query, update, opts).lean<{ views: number } | null>()

    if (!doc) return fail('대상을 찾을 수 없습니다.', 404)
    return ok({ views: doc.views })
  } catch (err) {
    return handleError(err)
  }
}
