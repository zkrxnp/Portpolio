import { z } from 'zod'
import { PROJECT_CATEGORIES, PROJECT_VISUALS, PROJECT_STATUSES } from './models/Project'
import { LOG_CATEGORIES } from './models/Post'

/** 링크는 http(s)만. javascript:, data: 같은 스킴이 href로 들어가는 것을 막습니다. */
const httpUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'http(s)로 시작하는 주소만 넣을 수 있습니다.')

/** 대표 이미지: 사이트 안 경로(/images/x.png) 또는 https 주소. 프로토콜 상대(//)는 거부. */
const imagePath = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) => v === '' || /^\/(?!\/)[\w\-./]+$/.test(v) || /^https:\/\/\S+$/i.test(v),
    '/로 시작하는 사이트 경로나 https 주소만 넣을 수 있습니다.',
  )

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, '잘못된 식별자입니다.')

// 제어 문자(줄바꿈·탭 제외)와 보이지 않는 방향 제어 문자. 소스에 실제 문자를 넣지 않도록 \u 표기만 씁니다.
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁯﻿]/g

/**
 * 보이지 않는 문자를 지우고 앞뒤 공백을 자릅니다.
 * 공백만 있는 입력은 이 단계에서 빈 문자열이 되어 min 검사에 걸립니다.
 * HTML은 지우지 않습니다. 화면에서 React가 텍스트로 이스케이프하므로 실행되지 않습니다.
 */
export function cleanText(s: string): string {
  return s.replace(INVISIBLE, '').trim()
}

export const projectInput = z.object({
  title: z.string().min(1, '제목을 입력하세요.').max(80),
  slug: z.string().max(80).optional(),
  summary: z.string().min(1, '요약을 입력하세요.').max(300),
  body: z.string().max(60_000).default(''),
  category: z.enum(PROJECT_CATEGORIES),
  visual: z.enum(PROJECT_VISUALS).default('none'),
  status: z.enum(PROJECT_STATUSES).default('완료'),
  thumbnail: imagePath.default(''),
  period: z.string().max(40).default(''),
  role: z.string().max(120).default(''),
  stack: z.array(z.string().max(40)).max(20).default([]),
  links: z
    .object({
      repo: httpUrl.default(''),
      writeup: httpUrl.default(''),
      demo: httpUrl.default(''),
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
  category: z.enum(LOG_CATEGORIES).default('기타'),
  relatedProjectIds: z.array(objectId).max(10).default([]),
  published: z.boolean().default(false),
})

export const messageInput = z.object({
  name: z.string().min(1, '이름을 입력하세요.').max(60),
  email: z.string().email('이메일 형식이 올바르지 않습니다.').max(160),
  org: z.string().max(100).default(''),
  kind: z.enum(['프로젝트·협업', '스터디·세미나', '채용·인턴', '기타']).default('기타'),
  body: z.string().min(10, '내용을 10자 이상 적어주세요.').max(4000),
  // 허니팟. 여기서 max(0)으로 막으면 422에 필드 이름이 실려 봇에게 함정을 알려주고,
  // 라우트의 "성공처럼 응답하고 버리기"에 닿지도 못합니다. 판정은 라우트에서 합니다.
  website: z.string().max(500).optional(),
})

/** 방명록. 이름의 줄바꿈·연속 공백은 공백 하나로 바꿉니다. */
export const guestbookInput = z.object({
  name: z
    .string()
    .max(200)
    .transform((s) => cleanText(s).replace(/\s+/g, ' '))
    .pipe(z.string().min(1, '이름을 입력하세요.').max(40, '이름은 40자까지입니다.')),
  message: z
    .string()
    .max(2000)
    .transform(cleanText)
    .pipe(z.string().min(2, '메시지를 2자 이상 적어주세요.').max(500, '메시지는 500자까지입니다.')),
  website: z.string().max(500).optional(),
})

// ── 목록 조회 쿼리 (페이지와 API가 같은 스키마를 씁니다) ────────────────
const page = z.coerce.number().int().min(1).max(1000).default(1)
const q = z.string().trim().max(100).default('')

export const projectQuery = z.object({
  q,
  category: z.enum(['', '전체', ...PROJECT_CATEGORIES]).default(''),
  tech: z.string().trim().max(40).default(''),
  status: z.enum(['', ...PROJECT_STATUSES]).default(''),
  sort: z.enum(['featured', 'latest', 'name']).default('featured'),
  page,
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

export const logQuery = z.object({
  q,
  tag: z.string().trim().max(30).default(''),
  category: z.enum(['', '전체', ...LOG_CATEGORIES]).default(''),
  sort: z.enum(['newest', 'oldest']).default('newest'),
  page,
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export const guestbookQuery = z.object({
  page,
  limit: z.coerce.number().int().min(1).max(20).default(10),
})

export type ProjectQuery = z.infer<typeof projectQuery>
export type LogQuery = z.infer<typeof logQuery>

/** URLSearchParams 또는 Next의 searchParams 객체에서 키마다 첫 값만 뽑습니다. */
export function firstValues(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {}
  if (input instanceof URLSearchParams) {
    for (const k of new Set(input.keys())) out[k] = input.get(k) ?? ''
  } else {
    for (const [k, v] of Object.entries(input)) {
      const first = Array.isArray(v) ? v[0] : v
      if (first !== undefined) out[k] = first
    }
  }
  return out
}

export type ProjectInput = z.infer<typeof projectInput>
export type PostInput = z.infer<typeof postInput>
export type MessageInput = z.infer<typeof messageInput>
export type GuestbookInput = z.infer<typeof guestbookInput>
