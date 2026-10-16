import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Error as MongooseError } from 'mongoose'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

/** 라우트 핸들러의 공통 에러 처리. 내부 메시지를 그대로 흘리지 않습니다. */
export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return fail('입력값이 올바르지 않습니다.', 422, {
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
  }
  // zod를 통과해도 모델 제약(필수 필드 등)에 걸릴 수 있습니다. 500이 아니라 입력 문제로 돌려줍니다.
  if (err instanceof MongooseError.ValidationError) {
    return fail('입력값이 올바르지 않습니다.', 422, {
      issues: Object.keys(err.errors).map((path) => ({ path, message: '모델 제약을 만족하지 않습니다.' })),
    })
  }
  if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
    return fail('이미 같은 슬러그가 있습니다.', 409)
  }
  console.error('[api]', err)
  return fail('서버에서 처리하지 못했습니다.', 500)
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** 같은 키가 반복되면(?q=a&q=b) Next는 searchParams 값을 배열로 넘깁니다. 첫 값만 씁니다. */
export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

/**
 * Next 16의 페이지 컴포넌트는 params를 퍼센트 인코딩된 채로 받습니다
 * (generateMetadata는 디코딩된 값을 받아서, 한글 슬러그면 둘이 어긋납니다).
 * slugify가 %를 지우므로 저장된 슬러그에는 %가 없고, 디코딩은 멱등합니다.
 */
export function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
