/** lib/oauth.ts의 보안 판정 로직 테스트. 네트워크는 타지 않습니다. */
process.env.AUTH_SECRET = 'x'.repeat(40)

import { createHash } from 'crypto'
import { pkce, randomToken, safeEqual, isAllowed, safeReturnPath, authorizeUrl, type GitHubUser } from '../lib/oauth'

let pass = 0, fail = 0
function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log('  ok  ', name) }
  else { fail++; console.log('  FAIL', name, extra) }
}

const user = (over: Partial<GitHubUser> = {}): GitHubUser => ({
  id: 12345678, login: 'jiwoo', name: '한지우', avatar_url: 'https://x/y.png', ...over,
})

function env(vars: Record<string, string | undefined>) {
  delete process.env.ADMIN_GITHUB_IDS
  delete process.env.ADMIN_GITHUB_LOGIN
  for (const [k, v] of Object.entries(vars)) if (v !== undefined) process.env[k] = v
}

console.log('\n[state 비교]')
const s1 = randomToken()
check('같은 값은 통과', safeEqual(s1, s1))
check('다른 값은 거부', !safeEqual(s1, randomToken()))
check('undefined는 거부', !safeEqual(s1, undefined))
check('빈 문자열은 거부', !safeEqual(s1, ''))
check('길이가 다르면 던지지 않고 거부', !safeEqual(s1, s1.slice(0, 10)))
check('접두사만 같아도 거부', !safeEqual(s1, s1.slice(0, -1) + 'A'))
check('토큰이 충분히 큼', randomToken().length >= 43, String(randomToken().length))
check('매번 다른 값', new Set(Array.from({ length: 200 }, () => randomToken())).size === 200)

console.log('\n[PKCE]')
const { verifier, challenge } = pkce()
const expected = createHash('sha256').update(verifier).digest('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
check('challenge = BASE64URL(SHA256(verifier))', challenge === expected)
check('challenge에 URL 비안전 문자 없음', !/[+/=]/.test(challenge))
check('verifier와 challenge가 다름', verifier !== challenge)
check('verifier 길이가 RFC 7636 범위(43~128)', verifier.length >= 43 && verifier.length <= 128, String(verifier.length))

console.log('\n[authorize URL]')
const au = new URL(authorizeUrl({ clientId: 'cid', redirectUri: 'https://x/cb', state: 'st', challenge: 'ch' }))
check('S256을 명시', au.searchParams.get('code_challenge_method') === 'S256')
check('challenge 전달', au.searchParams.get('code_challenge') === 'ch')
check('state 전달', au.searchParams.get('state') === 'st')
check('scope는 비어 있음 (최소 권한)', au.searchParams.get('scope') === '')
check('가입 유도 끔', au.searchParams.get('allow_signup') === 'false')
check('client_secret이 URL에 없음', !au.search.includes('secret'))

console.log('\n[허용 목록]')
env({ ADMIN_GITHUB_IDS: '12345678' })
check('ID가 맞으면 허용', isAllowed(user()).ok)
check('ID 기반은 weak 아님', isAllowed(user()).weak === false)
check('다른 ID는 거부', !isAllowed(user({ id: 999 })).ok)
check('ID가 걸려 있으면 사용자명은 무시', !isAllowed(user({ id: 999, login: 'jiwoo' })).ok)

env({ ADMIN_GITHUB_IDS: ' 111 , 12345678 ,222 ' })
check('공백 섞인 목록도 처리', isAllowed(user()).ok)

env({ ADMIN_GITHUB_IDS: '1234567' })
check('ID 접두사 일치는 거부', !isAllowed(user()).ok)

env({ ADMIN_GITHUB_LOGIN: 'JiWoo' })
check('사용자명은 대소문자 무시하고 허용', isAllowed(user()).ok)
check('사용자명 기반은 weak 표시', isAllowed(user()).weak === true)
check('다른 사용자명은 거부', !isAllowed(user({ login: 'attacker' })).ok)

env({})
check('둘 다 비면 전부 거부 (열어두지 않음)', !isAllowed(user()).ok)

console.log('\n[열린 리다이렉트 방지]')
const bad = [
  'https://evil.com', '//evil.com', '/admin\\@evil.com', 'http://evil.com/admin',
  '/adminevil', '/', '/blog', 'javascript:alert(1)', '/admin://evil.com',
]
for (const b of bad) {
  const r = safeReturnPath(b)
  check(`"${b}" → /admin 으로 강제`, r === '/admin', `got ${r}`)
}
check('"/admin/projects"는 유지', safeReturnPath('/admin/projects') === '/admin/projects')
check('"/admin/posts/new"는 유지', safeReturnPath('/admin/posts/new') === '/admin/posts/new')
check('undefined는 /admin', safeReturnPath(undefined) === '/admin')

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
