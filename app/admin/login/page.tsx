import type { Metadata } from 'next'
import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { safeReturnPath } from '@/lib/oauth'
import { firstParam } from '@/lib/http'

export const metadata: Metadata = { title: '로그인', robots: { index: false, follow: false } }

const MESSAGES: Record<string, string> = {
  denied: 'GitHub에서 권한 요청을 취소했습니다.',
  state: '요청이 만료되었거나 흐름이 끊겼습니다. 다시 시도해주세요.',
  forbidden: '허용 목록에 없는 GitHub 계정입니다.',
  exchange: 'GitHub과 통신하지 못했습니다. 잠시 뒤 다시 시도해주세요.',
  unconfigured: 'GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET이 설정되지 않았습니다.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[]; min?: string | string[] }>
}) {
  const sp = await searchParams
  const error = firstParam(sp.error)
  const target = safeReturnPath(firstParam(sp.next))

  // min은 URL에서 오므로 아무 문장이나 들어올 수 있습니다. 관리자 로그인 화면의 경고 박스에
  // 피싱 문구를 띄우지 못하도록 formatRetry가 만드는 형태("N분")만 받습니다.
  const rawMin = firstParam(sp.min)
  const min = rawMin && /^\d{1,3}분$/.test(rawMin) ? rawMin : '잠시'

  const message =
    error === 'locked'
      ? `시도가 너무 많습니다. ${min} 뒤에 다시 시도하세요.`
      : error
        ? ((Object.hasOwn(MESSAGES, error) && MESSAGES[error]) || '로그인하지 못했습니다.')
        : null

  return (
    <section className="login">
      <h1>관리자 로그인</h1>
      <p className="note">
        허용 목록에 등록된 GitHub 계정만 들어올 수 있습니다. 비밀번호는 쓰지 않습니다.
      </p>

      {message && <p className="form-error" role="alert">{message}</p>}

      <a className="btn gh" href={`/api/auth/github?next=${encodeURIComponent(target)}`}>
        <LogIn /> GitHub으로 로그인
      </a>

      <p className="side-note" style={{ marginTop: 28 }}>
        <Link href="/">사이트로 돌아가기</Link>
      </p>
    </section>
  )
}
