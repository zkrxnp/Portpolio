import type { FilterQuery, SortOrder } from 'mongoose'
import dbConnect from './mongodb'
import Project, { type ProjectDoc } from './models/Project'
import Post, { type PostDoc } from './models/Post'
import Guestbook from './models/Guestbook'
import { decodeSlug } from './http'
import { projectQuery, logQuery, type ProjectQuery, type LogQuery } from './validation'

/**
 * 조회 계층. 공개 페이지(서버 컴포넌트)와 REST API(app/api 아래 라우트)가 같은 함수를 씁니다.
 * 필터·정렬·응답 형태를 한 곳에 두어 둘이 어긋나지 않게 합니다.
 *
 * - query·find 함수: 실패하면 예외를 던집니다. API 라우트가 handleError로 받습니다.
 * - get* 함수: 공개 페이지용. 실패하면 빈 값으로 떨어집니다(safe).
 */

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

/** 사용자 입력을 정규식에 넣기 전에 메타문자를 이스케이프합니다(ReDoS·패턴 주입 방지). */
function literal(s: string): RegExp {
  return new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
}

type Paged<T> = { items: T[]; total: number; page: number; pages: number }

// ── projects ────────────────────────────────────────────────────────────

export type ProjectCard = {
  _id: string
  title: string
  slug: string
  summary: string
  category: string
  visual: string
  status: string
  thumbnail: string
  githubUrl: string
  period: string
  role: string
  stack: string[]
  featured: boolean
  views: number
  createdAt: string | null
  updatedAt: string | null
}

export type RelatedLog = { slug: string; title: string; category: string; publishedAt: string | null }
export type ProjectDetail = ProjectCard & {
  body: string
  links: { repo: string; writeup: string; demo: string }
  relatedLogs: RelatedLog[]
}

const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null)

function toCard(p: Record<string, unknown>): ProjectCard {
  const links = (p.links ?? {}) as Record<string, string>
  return {
    _id: String(p._id),
    title: String(p.title ?? ''),
    slug: String(p.slug ?? ''),
    summary: String(p.summary ?? ''),
    category: String(p.category ?? ''),
    visual: String(p.visual ?? 'none'),
    status: String(p.status ?? '완료'),
    thumbnail: String(p.thumbnail ?? ''),
    githubUrl: String(links.repo ?? ''),
    period: String(p.period ?? ''),
    role: String(p.role ?? ''),
    stack: (p.stack as string[]) ?? [],
    featured: Boolean(p.featured),
    views: Number(p.views ?? 0),
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
  }
}

/**
 * API 응답 형태. DB 필드 이름은 기존 데이터를 지키려고 그대로 두고,
 * 명세의 이름(description·content·technologies·githubUrl)을 함께 실어 보냅니다.
 */
export function toProjectDTO(p: ProjectCard | ProjectDetail) {
  return {
    ...p,
    description: p.summary,
    technologies: p.stack,
    ...('body' in p ? { content: p.body } : {}),
  }
}

function projectFilter(q: ProjectQuery): FilterQuery<ProjectDoc> {
  const filter: FilterQuery<ProjectDoc> = { published: true }
  if (q.category && q.category !== '전체') filter.category = q.category
  if (q.status) filter.status = q.status
  // 기술은 대소문자만 무시한 정확 일치. 부분 일치로 하면 "C"가 "CodeBuild"까지 잡습니다.
  if (q.tech) filter.stack = new RegExp(`^${literal(q.tech).source}$`, 'i')
  if (q.q) {
    const rx = literal(q.q)
    filter.$or = [{ title: rx }, { summary: rx }, { stack: rx }]
  }
  return filter
}

const PROJECT_SORT: Record<ProjectQuery['sort'], Record<string, SortOrder>> = {
  featured: { featured: -1, order: 1, createdAt: -1 },
  latest: { createdAt: -1 },
  name: { title: 1 },
}

export async function queryProjects(input: Partial<ProjectQuery> = {}): Promise<Paged<ProjectCard>> {
  const q = projectQuery.parse(input)
  await dbConnect()
  const filter = projectFilter(q)
  const [docs, total] = await Promise.all([
    Project.find(filter)
      .select('-body')
      .sort(PROJECT_SORT[q.sort])
      // 이름순이 한글·영문 섞여도 사람이 기대하는 순서가 되도록
      .collation(q.sort === 'name' ? { locale: 'ko', strength: 2 } : { locale: 'simple' })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Project.countDocuments(filter),
  ])
  return {
    items: docs.map((d) => toCard(d as Record<string, unknown>)),
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / q.limit)),
  }
}

export async function findProject(raw: string): Promise<ProjectDetail | null> {
  const slug = decodeSlug(raw)
  await dbConnect()
  const doc = await Project.findOne({ slug, published: true }).lean<ProjectDoc | null>()
  if (!doc) return null
  const logs = await Post.find({ published: true, relatedProjectIds: doc._id })
    .select('slug title category publishedAt')
    .sort({ publishedAt: -1 })
    .lean()
  const links = (doc.links ?? {}) as Record<string, string>
  return {
    ...toCard(doc as unknown as Record<string, unknown>),
    body: String(doc.body ?? ''),
    links: { repo: links.repo ?? '', writeup: links.writeup ?? '', demo: links.demo ?? '' },
    relatedLogs: logs.map((l) => ({
      slug: String(l.slug),
      title: String(l.title),
      category: String(l.category ?? '기타'),
      publishedAt: iso(l.publishedAt),
    })),
  }
}

// 공개 페이지용 (실패 시 빈 값)
export async function getProjects(input: Partial<ProjectQuery> = {}) {
  return safe(async () => (await queryProjects({ limit: 50, ...input })).items, [] as ProjectCard[], 'projects')
}

export async function getProject(raw: string) {
  return safe(() => findProject(raw), null, 'project:' + raw)
}

/** 목록 화면의 필터 선택지. 실제로 공개된 프로젝트에 있는 값만 보여줍니다. */
export async function getProjectFacets() {
  return safe(
    async () => {
      await dbConnect()
      const [cats, techs, statuses] = await Promise.all([
        Project.distinct('category', { published: true }),
        Project.distinct('stack', { published: true }),
        Project.distinct('status', { published: true }),
      ])
      return {
        categories: ['전체', ...(cats as string[]).sort()],
        techs: (techs as string[]).sort((a, b) => a.localeCompare(b)),
        statuses: (statuses as string[]).sort(),
      }
    },
    { categories: ['전체'], techs: [] as string[], statuses: [] as string[] },
    'project facets',
  )
}

/** 예전 호출부 호환 */
export async function getCategories(): Promise<string[]> {
  return (await getProjectFacets()).categories
}

// ── research logs (posts 컬렉션) ────────────────────────────────────────

export type PostCard = {
  _id: string
  title: string
  slug: string
  excerpt: string
  tags: string[]
  category: string
  relatedProjectIds: string[]
  publishedAt: string | null
  readingMinutes: number
  views: number
}

export type RelatedProject = { _id: string; slug: string; title: string; category: string }
export type PostDetail = PostCard & { body: string; relatedProjects: RelatedProject[] }

function toPostCard(p: Record<string, unknown>): PostCard {
  return {
    _id: String(p._id),
    title: String(p.title ?? ''),
    slug: String(p.slug ?? ''),
    excerpt: String(p.excerpt ?? ''),
    tags: (p.tags as string[]) ?? [],
    category: String(p.category ?? '기타'),
    relatedProjectIds: ((p.relatedProjectIds as unknown[]) ?? []).map(String),
    publishedAt: iso(p.publishedAt),
    readingMinutes: Number(p.readingMinutes ?? 1),
    views: Number(p.views ?? 0),
  }
}

/** API 응답 형태. 명세의 summary·content 이름을 함께 싣습니다. */
export function toLogDTO(p: PostCard | PostDetail) {
  return { ...p, summary: p.excerpt, ...('body' in p ? { content: p.body } : {}) }
}

function logFilter(q: LogQuery): FilterQuery<PostDoc> {
  // 비공개 기록은 어떤 조건으로도 공개 조회에 섞이지 않습니다.
  const filter: FilterQuery<PostDoc> = { published: true }
  if (q.tag) filter.tags = q.tag
  if (q.category && q.category !== '전체') filter.category = q.category
  if (q.q) {
    const rx = literal(q.q)
    filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }]
  }
  return filter
}

export async function queryLogs(input: Partial<LogQuery> = {}): Promise<Paged<PostCard>> {
  const q = logQuery.parse(input)
  await dbConnect()
  const filter = logFilter(q)
  const dir = q.sort === 'oldest' ? 1 : -1
  const [docs, total] = await Promise.all([
    Post.find(filter).select('-body').sort({ publishedAt: dir, _id: dir }).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
    Post.countDocuments(filter),
  ])
  return {
    items: docs.map((d) => toPostCard(d as Record<string, unknown>)),
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / q.limit)),
  }
}

export async function findLog(raw: string): Promise<PostDetail | null> {
  const slug = decodeSlug(raw)
  await dbConnect()
  const doc = await Post.findOne({ slug, published: true }).lean<PostDoc | null>()
  if (!doc) return null
  const ids = (doc.relatedProjectIds ?? []) as unknown[]
  const projects = ids.length
    ? await Project.find({ _id: { $in: ids }, published: true }).select('slug title category').lean()
    : []
  return {
    ...toPostCard(doc as unknown as Record<string, unknown>),
    body: String(doc.body ?? ''),
    relatedProjects: projects.map((p) => ({ _id: String(p._id), slug: String(p.slug), title: String(p.title), category: String(p.category) })),
  }
}

export async function getPosts(input: Partial<LogQuery> = {}) {
  return safe(async () => (await queryLogs({ limit: 50, ...input })).items, [] as PostCard[], 'posts')
}

export async function getPost(raw: string) {
  return safe(() => findLog(raw), null, 'post:' + raw)
}

export async function getLogFacets() {
  return safe(
    async () => {
      await dbConnect()
      const [tags, cats] = await Promise.all([
        Post.distinct('tags', { published: true }),
        Post.distinct('category', { published: true }),
      ])
      return { tags: (tags as string[]).sort(), categories: ['전체', ...(cats as string[]).sort()] }
    },
    { tags: [] as string[], categories: ['전체'] },
    'log facets',
  )
}

/** 예전 호출부 호환 */
export async function getTags(): Promise<string[]> {
  return (await getLogFacets()).tags
}

// ── guestbook ───────────────────────────────────────────────────────────

export type GuestbookEntry = { _id: string; name: string; message: string; createdAt: string }

export async function queryGuestbook(page: number, limit: number): Promise<Paged<GuestbookEntry>> {
  await dbConnect()
  const [docs, total] = await Promise.all([
    Guestbook.find({}).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Guestbook.countDocuments({}),
  ])
  return {
    items: docs.map((d) => ({
      _id: String(d._id),
      name: String(d.name),
      message: String(d.message),
      createdAt: new Date(d.createdAt as unknown as string).toISOString(),
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  }
}
