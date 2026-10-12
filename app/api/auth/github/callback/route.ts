import { NextResponse, type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'
import { signSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'
import {
  exchangeCode, fetchGitHubUser, isAllowed, safeEqual, safeReturnPath,
  STATE_COOKIE, VERIFIER_COOKIE, RETURN_COOKIE,
} from '@/lib/oauth'
import { checkLock, recordFailure, clearFailures, hashIp, clientIp, formatRetry } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

function back(req: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/admin/login?error=${error}`, req.url))
}

/** 일회용 쿠키들을 응답에서 지웁니다. 성공이든 실패든 재사용을 막습니다. */
function clearTemp(res: NextResponse) {
  for (const name of [STATE_COOKIE, VERIFIER_COOKIE, RETURN_COOKIE]) {
    res.cookies.set(name, '', { path: '/', maxAge: 0 })
  }
  return res
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  // 사용자가 GitHub 화면에서 취소한 경우
  if (sp.get('error')) return clearTemp(back(req, 'denied'))

  const code = sp.get('code')
  const state = sp.get('state')
  const cookieState = req.cookies.get(STATE_COOKIE)?.value
  const verifier = req.cookies.get(VERIFIER_COOKIE)?.value

  // state 불일치는 CSRF 시도이거나 흐름이 깨진 것입니다. 어느 쪽이든 중단합니다.
  if (!code || !safeEqual(state ?? undefined, cookieState) || !verifier) {
    return clearTemp(back(req, 'state'))
  }

  const ipHash = hashIp(clientIp(req.headers))

  try {
    await dbConnect()

    // 허용 목록 밖에서 반복해서 두드리는 경우를 막습니다.
    const lock = await checkLock(ipHash, 'oauth')
    if (lock.locked) {
      return clearTemp(
        NextResponse.redirect(
          new URL(`/admin/login?error=locked&min=${encodeURIComponent(formatRetry(lock.retryAfterMs))}`, req.url),
        ),
      )
    }

    const redirectUri = new URL('/api/auth/github/callback', req.nextUrl.origin).toString()
    const token = await exchangeCode({ code, verifier, redirectUri })
    const ghUser = await fetchGitHubUser(token)

    const { ok, weak } = isAllowed(ghUser)
    if (!ok) {
      await recordFailure(ipHash, 'oauth')
      console.warn(`[auth] 허용되지 않은 GitHub 계정 시도: ${ghUser.login} (id ${ghUser.id})`)
      return clearTemp(back(req, 'forbidden'))
    }

    if (weak) {
      console.warn(
        `[auth] ADMIN_GITHUB_IDS 없이 사용자명으로 인증했습니다. ` +
        `ADMIN_GITHUB_IDS="${ghUser.id}" 로 바꾸는 편이 안전합니다.`,
      )
    }

    // 숫자 ID를 키로 upsert합니다. 사용자명이 바뀌어도 같은 사람으로 남습니다.
    const user = await User.findOneAndUpdate(
      { githubId: ghUser.id },
      {
        $set: {
          githubLogin: ghUser.login,
          name: ghUser.name || ghUser.login,
          avatarUrl: ghUser.avatar_url,
          lastLoginAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    await clearFailures(ipHash, 'oauth')

    const sessionToken = await signSession({
      sub: String(user._id),
      login: ghUser.login,
      name: user.name ?? ghUser.login,
    })

    const next = safeReturnPath(req.cookies.get(RETURN_COOKIE)?.value)
    const res = NextResponse.redirect(new URL(next, req.url))
    res.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions)
    return clearTemp(res)
  } catch (err) {
    console.error('[auth] OAuth 콜백 실패', err)
    return clearTemp(back(req, 'exchange'))
  }
}
