import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from './lib/auth'

/**
 * /admin 이하를 통째로 막습니다. 페이지에서만 검사하면 API가 열린 채로 남기 쉬워서
 * 쓰기 계열 API도 여기서 함께 거릅니다.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
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
