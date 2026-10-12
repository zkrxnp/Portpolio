import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'jw_session'
const MAX_AGE_SECONDS = 60 * 60 * 8 // 8시간

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET이 없거나 32자 미만입니다. openssl rand -base64 32로 생성하세요.')
  }
  return new TextEncoder().encode(secret)
}

export type SessionPayload = {
  sub: string
  login: string
  name: string
}

/** jose는 Edge 런타임에서도 동작하므로 미들웨어와 라우트 양쪽에서 같은 함수를 씁니다. */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ login: payload.login, name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    if (!payload.sub) return null
    return {
      sub: payload.sub,
      login: String(payload.login ?? ''),
      name: String(payload.name ?? '관리자'),
    }
  } catch {
    return null
  }
}

/** 서버 컴포넌트/라우트 핸들러에서 현재 로그인 상태를 읽습니다. */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  return verifySession(jar.get(SESSION_COOKIE)?.value)
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
}
