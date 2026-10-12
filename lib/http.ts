import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

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
