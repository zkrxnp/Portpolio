import { NextResponse, type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Project from '@/lib/models/Project'
import Post from '@/lib/models/Post'
import { decodeSlug } from '@/lib/http'
import { wikiSlug } from '@/lib/markdown'

export const dynamic = 'force-dynamic'

/**
 * 위키링크 [[slug]]의 도착지. 공개된 프로젝트 → 기록 순으로 찾고, 없으면 그 이름으로 기록을 검색합니다
 * (옵시디언의 "아직 없는 노트"에 해당). 이동 주소는 항상 여기서 사이트 안 경로로 만듭니다.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const slug = wikiSlug(decodeSlug((await params).slug))
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url), 307)
  if (!slug) return to('/blog')
  try {
    await dbConnect()
    if (await Project.exists({ slug, published: true })) return to(`/projects/${encodeURIComponent(slug)}`)
    if (await Post.exists({ slug, published: true })) return to(`/blog/${encodeURIComponent(slug)}`)
  } catch {
    // DB가 안 되면 검색 화면으로라도 보냅니다.
  }
  return to(`/blog?q=${encodeURIComponent(slug)}`)
}
