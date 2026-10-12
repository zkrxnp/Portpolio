import { createHash, randomBytes, timingSafeEqual } from 'crypto'

/**
 * GitHub OAuth (web application flow) + PKCE.
 *
 * 허용 목록은 **숫자 ID**로 거는 것을 기본으로 합니다. 사용자명은 바꿀 수 있고
 * 계정을 지우면 남이 다시 가져갈 수 있어서, 이름으로 걸면 그 계정을 선점한
 * 사람이 관리자가 됩니다.
 */

export const STATE_COOKIE = 'gh_state'
export const VERIFIER_COOKIE = 'gh_verifier'
export const RETURN_COOKIE = 'gh_return'

// GitHub의 code는 10분 안에 만료됩니다. 쿠키도 같이 짧게 둡니다.
export const OAUTH_COOKIE_MAX_AGE = 10 * 60

export const oauthCookieOptions = {
  httpOnly: true,
  // Strict로 두면 github.com에서 돌아오는 최상위 이동에 쿠키가 실리지 않아
  // state 검증이 항상 실패합니다. Lax가 이 흐름에서 맞습니다.
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: OAUTH_COOKIE_MAX_AGE,
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function randomToken(bytes = 32): string {
  return b64url(randomBytes(bytes))
}

/** PKCE: verifier는 쿠키에, challenge는 GitHub에 보냅니다. */
export function pkce(): { verifier: string; challenge: string } {
  const verifier = randomToken(32)
  const challenge = b64url(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

/** state 비교는 길이를 먼저 맞춰야 timingSafeEqual이 던지지 않습니다. */
export function safeEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export function authorizeUrl(opts: {
  clientId: string
  redirectUri: string
  state: string
  challenge: string
}): string {
  const u = new URL('https://github.com/login/oauth/authorize')
  u.searchParams.set('client_id', opts.clientId)
  u.searchParams.set('redirect_uri', opts.redirectUri)
  u.searchParams.set('state', opts.state)
  u.searchParams.set('code_challenge', opts.challenge)
  u.searchParams.set('code_challenge_method', 'S256')
  // scope를 비워도 /user로 공개 프로필과 숫자 ID를 읽을 수 있습니다.
  // 신원 확인에 그 이상은 필요 없으므로 요구하지 않습니다.
  u.searchParams.set('scope', '')
  u.searchParams.set('allow_signup', 'false')
  return u.toString()
}

export type GitHubUser = { id: number; login: string; name: string | null; avatar_url: string }

export async function exchangeCode(opts: {
  code: string
  verifier: string
  redirectUri: string
}): Promise<string> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: opts.code,
      redirect_uri: opts.redirectUri,
      code_verifier: opts.verifier,
    }),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`)

  const data = (await res.json()) as {
    access_token?: string
    token_type?: string
    error?: string
    error_description?: string
  }

  if (data.error) throw new Error(`token exchange error: ${data.error}`)
  if (!data.access_token) throw new Error('token exchange returned no access_token')
  return data.access_token
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'jiwoo-portfolio',
      'x-github-api-version': '2022-11-28',
    },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`user fetch failed: ${res.status}`)
  return (await res.json()) as GitHubUser
}

/**
 * 허용 목록 판정.
 * ADMIN_GITHUB_IDS가 있으면 그것만 봅니다. 없으면 ADMIN_GITHUB_LOGIN으로
 * 떨어지되, 이름은 바뀔 수 있으므로 권장하지 않습니다.
 */
export function isAllowed(user: GitHubUser): { ok: boolean; weak: boolean } {
  const ids = (process.env.ADMIN_GITHUB_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (ids.length > 0) {
    return { ok: ids.includes(String(user.id)), weak: false }
  }

  const logins = (process.env.ADMIN_GITHUB_LOGIN ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (logins.length > 0) {
    return { ok: logins.includes(user.login.toLowerCase()), weak: true }
  }

  // 둘 다 비어 있으면 아무도 들어올 수 없게 합니다. 열어두는 것보다 낫습니다.
  return { ok: false, weak: false }
}

/** 열린 리다이렉트 방지. /admin 또는 그 하위 경로만 허용합니다. */
export function safeReturnPath(raw: string | undefined): string {
  const FALLBACK = '/admin'
  if (!raw) return FALLBACK

  // "//evil.com"(프로토콜 상대), 역슬래시, 스킴이 섞인 값을 먼저 거릅니다.
  if (raw.startsWith('//') || raw.includes('\\') || raw.includes('://')) return FALLBACK

  // startsWith('/admin')만 보면 "/adminevil" 같은 다른 경로가 통과합니다.
  // 정확히 /admin이거나 /admin/ 로 이어지는 경우만 받습니다.
  if (raw !== '/admin' && !raw.startsWith('/admin/')) return FALLBACK

  return raw
}
