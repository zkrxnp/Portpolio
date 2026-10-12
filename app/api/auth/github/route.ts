import { NextResponse, type NextRequest } from 'next/server'
import {
  authorizeUrl, pkce, randomToken, safeReturnPath,
  STATE_COOKIE, VERIFIER_COOKIE, RETURN_COOKIE, oauthCookieOptions,
} from '@/lib/oauth'

export const dynamic = 'force-dynamic'

/** 로그인 시작. state와 PKCE verifier를 쿠키에 심고 GitHub으로 보냅니다. */
export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId || !process.env.GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/admin/login?error=unconfigured', req.url))
  }

  const state = randomToken()
  const { verifier, challenge } = pkce()
  const next = safeReturnPath(req.nextUrl.searchParams.get('next') ?? undefined)

  // redirect_uri는 GitHub 앱에 등록한 값과 정확히 같아야 합니다.
  const redirectUri = new URL('/api/auth/github/callback', req.nextUrl.origin).toString()

  const res = NextResponse.redirect(authorizeUrl({ clientId, redirectUri, state, challenge }))
  res.cookies.set(STATE_COOKIE, state, oauthCookieOptions)
  res.cookies.set(VERIFIER_COOKIE, verifier, oauthCookieOptions)
  res.cookies.set(RETURN_COOKIE, next, oauthCookieOptions)
  return res
}
