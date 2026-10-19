import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from './lib/auth'

/**
 * /admin 이하를 통째로 막습니다. 페이지에서만 검사하면 API가 열린 채로 남기 쉬워서
 * 쓰기 계열 API도 여기서 함께 거릅니다.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // CSRF: 관리자 API의 쓰기 요청은 같은 출처(Origin)에서 온 것만 받습니다.
  // 세션 쿠키가 SameSite=Lax라 교차 사이트 POST에는 원래 실리지 않지만, 한 겹 더 둡니다.
  // Origin이 아예 없는 요청(curl 등 브라우저 밖)도 거절합니다. 관리자 화면은 항상 Origin을 보냅니다.
  if (pathname.startsWith('/api/admin/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.headers.get('origin')
    if (!origin || origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: '허용되지 않은 요청 출처입니다.' }, { status: 403 })
    }
  }
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value)

  if (pathname === '/admin/login') {
    if (session) return NextResponse.redirect(new URL('/admin', req.url))
    return NextResponse.next()
  }

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const login = new URL('/admin/login', req.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
