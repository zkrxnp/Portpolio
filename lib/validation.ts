import { z } from 'zod'
import { PROJECT_CATEGORIES, PROJECT_VISUALS } from './models/Project'

export const projectInput = z.object({
  title: z.string().min(1, '제목을 입력하세요.').max(80),
  slug: z.string().max(80).optional(),
  summary: z.string().min(1, '요약을 입력하세요.').max(300),
  body: z.string().max(60_000).default(''),
  category: z.enum(PROJECT_CATEGORIES),
  visual: z.enum(PROJECT_VISUALS).default('none'),
  period: z.string().max(40).default(''),
  role: z.string().max(120).default(''),
  stack: z.array(z.string().max(40)).max(20).default([]),
  links: z
    .object({
      repo: z.string().max(300).default(''),
      writeup: z.string().max(300).default(''),
      demo: z.string().max(300).default(''),
    })
    .default({ repo: '', writeup: '', demo: '' }),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  order: z.number().int().min(0).max(999).default(0),
})

export const postInput = z.object({
  title: z.string().min(1, '제목을 입력하세요.').max(140),
  slug: z.string().max(140).optional(),
  excerpt: z.string().max(400).default(''),
  body: z.string().max(120_000).default(''),
  tags: z.array(z.string().max(30)).max(12).default([]),
  published: z.boolean().default(false),
})

export const messageInput = z.object({
  name: z.string().min(1, '이름을 입력하세요.').max(60),
  email: z.string().email('이메일 형식이 올바르지 않습니다.').max(160),
  org: z.string().max(100).default(''),
  kind: z.enum(['보안 점검', '사고 대응', '교육·멘토링', '기타']).default('기타'),
  body: z.string().min(10, '내용을 10자 이상 적어주세요.').max(4000),
  // 봇이 채우면 조용히 버립니다.
  website: z.string().max(0).optional(),
})

export type ProjectInput = z.infer<typeof projectInput>
export type PostInput = z.infer<typeof postInput>
export type MessageInput = z.infer<typeof messageInput>
