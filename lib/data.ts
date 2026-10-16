import dbConnect from './mongodb'
import Project, { type ProjectDoc } from './models/Project'
import Post, { type PostDoc } from './models/Post'
import { decodeSlug } from './http'

/** 서버 컴포넌트에서 쓰는 조회 함수들. 직렬화 가능한 평범한 객체로 바꿔 반환합니다. */

/**
 * 공개 페이지용 안전 래퍼.
 *
 * 빌드 시점에 DB가 없어도 배포가 되어야 하고(예: 프리뷰 빌드), 운영 중 DB가
 * 잠깐 끊겼을 때 포트폴리오 전체가 500을 내는 것보다 빈 목록이 낫습니다.
 * 관리자 화면은 이 래퍼를 쓰지 않고 에러를 그대로 올려 보냅니다.
 */
async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[data] ${label} 조회 실패 — 빈 값으로 대체합니다.`, err)
    return fallback
  }
}

export type ProjectCard = {
  _id: string
  title: string
  slug: string
  summary: string
  category: string
  visual: string
  period: string
  role: string
  stack: string[]
  featured: boolean
  views: number
}

function toCard(p: Record<string, unknown>): ProjectCard {
  return {
    _id: String(p._id),
    title: String(p.title ?? ''),
    slug: String(p.slug ?? ''),
    summary: String(p.summary ?? ''),
    category: String(p.category ?? ''),
    visual: String(p.visual ?? 'none'),
    period: String(p.period ?? ''),
    role: String(p.role ?? ''),
    stack: (p.stack as string[]) ?? [],
    featured: Boolean(p.featured),
    views: Number(p.views ?? 0),
  }
}

export async function getProjects(opts: { q?: string; category?: string; limit?: number } = {}) {
 return safe(async () => {
  await dbConnect()
  const filter: Record<string, unknown> = { published: true }
  if (opts.category && opts.category !== '전체') filter.category = opts.category
  if (opts.q) {
    const safe = opts.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp(safe, 'i')
    filter.$or = [{ title: rx }, { summary: rx }, { stack: rx }]
  }
  const docs = await Project.find(filter)
    .select('-body')
    .sort({ featured: -1, order: 1, createdAt: -1 })
    .limit(opts.limit ?? 50)
    .lean()
  return docs.map((d) => toCard(d as Record<string, unknown>))
 }, [] as ProjectCard[], 'projects')
}

export async function getProject(raw: string) {
 const slug = decodeSlug(raw)
 return safe(async () => {
  await dbConnect()
  const doc = await Project.findOne({ slug, published: true }).lean<ProjectDoc | null>()
  if (!doc) return null
  return { ...toCard(doc as unknown as Record<string, unknown>), body: String(doc.body ?? '') }
 }, null, 'project:' + slug)
}

export async function getCategories(): Promise<string[]> {
  return safe(async () => {
    await dbConnect()
    const cats = await Project.distinct('category', { published: true })
    return ['전체', ...(cats as string[]).sort()]
  }, ['전체'], 'categories')
}

export type PostCard = {
  _id: string
  title: string
  slug: string
  excerpt: string
  tags: string[]
  publishedAt: string | null
  readingMinutes: number
  views: number
}

function toPostCard(p: Record<string, unknown>): PostCard {
  return {
    _id: String(p._id),
    title: String(p.title ?? ''),
    slug: String(p.slug ?? ''),
    excerpt: String(p.excerpt ?? ''),
    tags: (p.tags as string[]) ?? [],
    publishedAt: p.publishedAt ? new Date(p.publishedAt as string).toISOString() : null,
    readingMinutes: Number(p.readingMinutes ?? 1),
    views: Number(p.views ?? 0),
  }
}

export async function getPosts(opts: { q?: string; tag?: string; limit?: number } = {}) {
 return safe(async () => {
  await dbConnect()
  const filter: Record<string, unknown> = { published: true }
  if (opts.tag) filter.tags = opts.tag
  if (opts.q) {
    const safe = opts.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp(safe, 'i')
    filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }]
  }
  const docs = await Post.find(filter).select('-body').sort({ publishedAt: -1 }).limit(opts.limit ?? 50).lean()
  return docs.map((d) => toPostCard(d as Record<string, unknown>))
 }, [] as PostCard[], 'posts')
}

export async function getPost(raw: string) {
 const slug = decodeSlug(raw)
 return safe(async () => {
  await dbConnect()
  const doc = await Post.findOne({ slug, published: true }).lean<PostDoc | null>()
  if (!doc) return null
  return { ...toPostCard(doc as unknown as Record<string, unknown>), body: String(doc.body ?? '') }
 }, null, 'post:' + slug)
}

export async function getTags(): Promise<string[]> {
  return safe(async () => {
    await dbConnect()
    const tags = await Post.distinct('tags', { published: true })
    return (tags as string[]).sort()
  }, [], 'tags')
}
