/**
 * REST API 통합 테스트. 실제로 떠 있는 서버에 HTTP로 요청합니다.
 *
 *   TEST_BASE_URL  대상 서버 (예: http://localhost:3100)
 *   MONGODB_URI    그 서버가 쓰는 DB — 픽스처를 만들고 지우려고 직접 붙습니다. 운영 DB를 넣지 마세요.
 *   AUTH_SECRET    그 서버와 같은 값 — 관리자 세션을 서명하는 데 씁니다.
 *
 * 관리자 로그인은 GitHub OAuth라 자동화할 수 없습니다. 그래서 서버와 같은 키로 세션 토큰을
 * 직접 서명해 "로그인된 상태"를 만들고, 그 뒤의 권한 검사·CRUD를 검증합니다.
 */
import mongoose from 'mongoose'
import { signSession } from '../lib/auth'
import Post from '../lib/models/Post'
import Project from '../lib/models/Project'
import Guestbook from '../lib/models/Guestbook'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3100'
const URI = process.env.MONGODB_URI ?? ''
if (!URI || /mongodb\.net/.test(URI)) {
  console.error('MONGODB_URI가 비었거나 Atlas(운영일 수 있음)입니다. 로컬 테스트 DB를 지정하세요.')
  process.exit(2)
}

let pass = 0
let fail = 0
function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log('  ok  ', name) }
  else { fail++; console.log('  FAIL', name, extra) }
}

type Res = { status: number; body: any; headers: Headers } // eslint-disable-line @typescript-eslint/no-explicit-any
async function call(path: string, init: RequestInit = {}): Promise<Res> {
  const res = await fetch(BASE + path, { redirect: 'manual', ...init })
  const text = await res.text()
  let body: unknown = text
  try { body = JSON.parse(text) } catch { /* 본문이 JSON이 아닌 경우 */ }
  return { status: res.status, body, headers: res.headers }
}
const json = (method: string, data: unknown, headers: Record<string, string> = {}): RequestInit => ({
  method,
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(data),
})

async function main() {
  await mongoose.connect(URI)
  const run = Date.now().toString(36)
  const ip = `198.51.100.${(Date.now() % 200) + 20}` // 실행마다 다른 발신지

  // ── projects ──────────────────────────────────────────────
  console.log('\n[프로젝트 API]')
  let r = await call('/api/projects')
  check('목록 200', r.status === 200, String(r.status))
  const items = r.body.items ?? []
  check('명세 필드(description·technologies·status·githubUrl) 포함', items.length > 0 && ['description', 'technologies', 'status', 'githubUrl'].every((k) => k in items[0]))
  check('목록에는 본문(content) 없음', items.every((p: { content?: string }) => p.content === undefined))

  r = await call('/api/projects?q=TrustGate')
  check('제목 검색', r.body.items?.some((p: { slug: string }) => p.slug === 'trustgate'))
  r = await call('/api/projects?category=' + encodeURIComponent('공급망'))
  check('카테고리 필터', r.body.items?.length > 0 && r.body.items.every((p: { category: string }) => p.category === '공급망'))
  r = await call('/api/projects?tech=docker')
  check('기술 필터(대소문자 무시)', r.body.items?.length > 0 && r.body.items.every((p: { stack: string[] }) => p.stack.some((s) => s.toLowerCase() === 'docker')))
  r = await call('/api/projects?tech=C')
  check('기술 필터는 정확 일치("C"가 CodeBuild를 잡지 않음)', r.body.items?.every((p: { stack: string[] }) => p.stack.includes('C')))
  r = await call('/api/projects?sort=name')
  const titles = (r.body.items ?? []).map((p: { title: string }) => p.title)
  check('이름순 정렬', JSON.stringify(titles) === JSON.stringify([...titles].sort((a: string, b: string) => a.localeCompare(b, 'ko'))), titles.join(' | '))
  r = await call('/api/projects?sort=latest')
  const dates = (r.body.items ?? []).map((p: { createdAt: string }) => p.createdAt)
  check('최신순 정렬', dates.every((d: string, i: number) => i === 0 || dates[i - 1] >= d))
  check('없는 정렬 키 → 422', (await call('/api/projects?sort=password')).status === 422)
  check('page=0 → 422', (await call('/api/projects?page=0')).status === 422)
  r = await call('/api/projects?q=' + encodeURIComponent('.*'))
  check('정규식 메타문자는 글자 그대로 검색', r.status === 200 && r.body.items.length === 0)
  check('연산자 주입 q[$ne] 무시', (await call('/api/projects?q[$ne]=x')).status === 200)

  r = await call('/api/projects/trustgate')
  check('상세 200 + content', r.status === 200 && typeof r.body.item?.content === 'string' && r.body.item.content.length > 0)
  check('상세에 연결된 Research Log', Array.isArray(r.body.item?.relatedLogs))
  r = await call('/api/projects/does-not-exist')
  check('없는 프로젝트 → 404 JSON', r.status === 404 && typeof r.body.error === 'string')
  check('없는 프로젝트 페이지 → 404', (await call('/projects/does-not-exist')).status === 404)

  // ── research logs ─────────────────────────────────────────
  console.log('\n[Research Log API]')
  const secretSlug = `secret-${run}`
  await Post.create({ title: '비공개 테스트 기록', slug: secretSlug, body: 'secret body', tags: ['비밀태그'], category: 'CTF', published: false })

  r = await call('/api/research-logs')
  check('목록 200', r.status === 200)
  check('summary 필드 포함', r.body.items?.length > 0 && 'summary' in r.body.items[0])
  check('비공개 기록이 목록에 없음', !r.body.items.some((p: { slug: string }) => p.slug === secretSlug))
  check('비공개 기록 상세 → 404', (await call(`/api/research-logs/${secretSlug}`)).status === 404)
  check('비공개 기록 페이지 → 404', (await call(`/blog/${secretSlug}`)).status === 404)
  r = await call('/api/research-logs?tag=' + encodeURIComponent('비밀태그'))
  check('비공개 기록은 태그로도 안 나옴', r.body.items?.length === 0)
  r = await call('/api/research-logs?q=' + encodeURIComponent('비공개 테스트'))
  check('비공개 기록은 검색으로도 안 나옴', r.body.items?.length === 0)
  r = await call('/api/research-logs?tag=IAM')
  check('태그 필터', r.body.items?.length > 0 && r.body.items.every((p: { tags: string[] }) => p.tags.includes('IAM')))
  r = await call('/api/research-logs?category=' + encodeURIComponent('리버싱'))
  check('카테고리 필터', r.body.items?.length > 0 && r.body.items.every((p: { category: string }) => p.category === '리버싱'))
  r = await call('/api/research-logs?sort=oldest')
  const pd = (r.body.items ?? []).map((p: { publishedAt: string }) => p.publishedAt)
  check('오래된순 정렬', pd.every((d: string, i: number) => i === 0 || pd[i - 1] <= d))
  r = await call('/api/research-logs/trustgate-silent-bugs')
  check('상세 200 + content + 관련 프로젝트', r.status === 200 && r.body.item?.content?.length > 0 && r.body.item.relatedProjects?.some((p: { slug: string }) => p.slug === 'trustgate'))
  check('예전 주소 /api/posts 호환', (await call('/api/posts')).status === 200)

  // ── guestbook ─────────────────────────────────────────────
  console.log('\n[방명록 API]')
  const H = { 'x-forwarded-for': ip }
  r = await call('/api/guestbook')
  check('목록 200 + 페이지 정보', r.status === 200 && Array.isArray(r.body.items) && typeof r.body.pages === 'number')

  const name = `테스터-${run}`
  r = await call('/api/guestbook', json('POST', { name, message: '정상 메시지입니다' }, H))
  check('정상 등록 201', r.status === 201, String(r.status))
  r = await call('/api/guestbook?page=1&limit=5')
  check('최신 메시지가 맨 위', r.body.items?.[0]?.name === name)

  const xss = '<script>alert(1)</script><img src=x onerror=alert(1)>'
  r = await call('/api/guestbook', json('POST', { name: 'xss', message: xss }, H))
  check('XSS 문자열은 텍스트로 저장(201)', r.status === 201 && r.body.item?.message === xss)
  check('응답은 JSON(HTML로 해석되지 않음)', (r.headers.get('content-type') ?? '').includes('application/json'))

  r = await call('/api/guestbook', json('POST', { name: '   ', message: '안녕하세요' }, H))
  check('공백 이름 → 422 + 필드 위치', r.status === 422 && r.body.issues?.some((i: { path: string }) => i.path === 'name'))
  r = await call('/api/guestbook', json('POST', { name: 'a', message: 'x'.repeat(501) }, H))
  check('메시지 501자 → 422', r.status === 422)
  r = await call('/api/guestbook', json('POST', { name: { $gt: '' }, message: '안녕하세요' }, H))
  check('연산자 객체 → 422', r.status === 422)
  r = await call('/api/guestbook', { method: 'POST', headers: { 'content-type': 'text/plain', ...H }, body: 'hi' })
  check('JSON 아님 → 415', r.status === 415)
  r = await call('/api/guestbook', { method: 'POST', headers: { 'content-type': 'application/json', ...H }, body: '{bad' })
  check('깨진 JSON → 400', r.status === 400)
  r = await call('/api/guestbook', json('POST', { name: 'a', message: 'x'.repeat(5000) }, H))
  check('4KB 초과 → 413', r.status === 413)

  const before = await Guestbook.countDocuments({ name: 'bot' })
  r = await call('/api/guestbook', json('POST', { name: 'bot', message: '스팸입니다', website: 'http://spam' }, { 'x-forwarded-for': '192.0.2.250' }))
  check('허니팟: 201로 응답하지만 저장하지 않음', r.status === 201 && (await Guestbook.countDocuments({ name: 'bot' })) === before)

  r = await call('/api/guestbook', json('POST', { name: 'third', message: '세 번째 메시지' }, H))
  check('같은 발신지 3번째까지 허용', r.status === 201, String(r.status))
  r = await call('/api/guestbook', json('POST', { name: 'fourth', message: '네 번째 메시지' }, H))
  check('같은 발신지 4번째 → 429', r.status === 429, String(r.status))
  check('429 응답에 내부 정보 없음', !JSON.stringify(r.body).match(/stack|at \/|node_modules|MONGODB|mongodb:/i))

  // ── admin ─────────────────────────────────────────────────
  console.log('\n[관리자 API 권한]')
  const token = await signSession({ sub: '0', login: 'api-test', name: '테스트' })
  const cookie = { cookie: `jw_session=${token}` }
  const origin = { origin: BASE }
  const gbId = String((await Guestbook.findOne({ name }).lean())?._id)

  check('비인증 GET → 401', (await call('/api/admin/projects')).status === 401)
  check('비인증 DELETE → 401', (await call(`/api/admin/guestbook/${gbId}`, { method: 'DELETE', headers: origin })).status === 401)
  check('위조 토큰(alg:none) → 401', (await call('/api/admin/projects', { headers: { cookie: 'jw_session=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.' } })).status === 401)
  check('인증됐어도 Origin 없음 → 403', (await call(`/api/admin/guestbook/${gbId}`, { method: 'DELETE', headers: cookie })).status === 403)
  check('인증됐어도 다른 Origin → 403', (await call(`/api/admin/guestbook/${gbId}`, { method: 'DELETE', headers: { ...cookie, origin: 'https://evil.example' } })).status === 403)
  check('비인증 관리자 페이지 → 로그인으로', [307, 308].includes((await call('/admin')).status))

  console.log('\n[관리자 CRUD]')
  const A = { ...cookie, ...origin }
  r = await call('/api/admin/projects', json('POST', {
    title: `테스트 프로젝트 ${run}`, summary: '요약', category: '시스템', status: '진행 중',
    stack: ['Go'], links: { repo: 'https://github.com/x/y' }, body: '## 목표\n\n테스트', published: true,
  }, A))
  check('프로젝트 생성 201', r.status === 201, JSON.stringify(r.body).slice(0, 200))
  const pid = r.body.item?._id
  const pslug = r.body.item?.slug
  r = await call('/api/admin/projects', json('POST', { title: 'bad', summary: 's', category: '시스템', links: { repo: 'javascript:alert(1)' } }, A))
  check('javascript: 링크 → 422', r.status === 422)
  r = await call(`/api/projects/${encodeURIComponent(pslug)}`)
  check('생성한 프로젝트 공개 조회 + 상태', r.status === 200 && r.body.item?.status === '진행 중')
  r = await call(`/api/admin/projects/${pid}`, json('PUT', { title: `테스트 프로젝트 ${run}`, summary: '수정됨', category: '시스템', status: '완료' }, A))
  check('프로젝트 수정 200', r.status === 200 && r.body.item?.summary === '수정됨')
  check('프로젝트 삭제 200', (await call(`/api/admin/projects/${pid}`, { method: 'DELETE', headers: A })).status === 200)
  check('삭제 후 404', (await call(`/api/projects/${encodeURIComponent(pslug)}`)).status === 404)

  const trust = await Project.findOne({ slug: 'trustgate' }).lean()
  r = await call('/api/admin/posts', json('POST', {
    title: `테스트 기록 ${run}`, body: '```c\nint main(){}\n```', tags: ['test'], category: 'CTF',
    relatedProjectIds: [String(trust?._id)], published: false,
  }, A))
  check('기록 생성(비공개) 201', r.status === 201, JSON.stringify(r.body).slice(0, 200))
  const lid = r.body.item?._id
  const lslug = r.body.item?.slug
  check('비공개 상태에선 공개 API 404', (await call(`/api/research-logs/${encodeURIComponent(lslug)}`)).status === 404)
  r = await call(`/api/admin/posts/${lid}`, json('PATCH', { published: true }, A))
  check('공개 전환 PATCH 200 + 발행일', r.status === 200 && r.body.item?.published === true && Boolean(r.body.item?.publishedAt))
  r = await call(`/api/research-logs/${encodeURIComponent(lslug)}`)
  check('공개 후 조회 + 관련 프로젝트', r.status === 200 && r.body.item?.relatedProjects?.[0]?.slug === 'trustgate')
  check('PATCH에 다른 필드 섞으면 422', (await call(`/api/admin/posts/${lid}`, json('PATCH', { published: true, title: 'x' }, A))).status === 422)
  check('기록 삭제 200', (await call(`/api/admin/posts/${lid}`, { method: 'DELETE', headers: A })).status === 200)

  check('방명록 삭제 200', (await call(`/api/admin/guestbook/${gbId}`, { method: 'DELETE', headers: A })).status === 200)
  check('삭제된 메시지는 DB에 없음', !(await Guestbook.findById(gbId).lean()))
  check('없는 id 삭제 → 404', (await call('/api/admin/guestbook/000000000000000000000000', { method: 'DELETE', headers: A })).status === 404)
  check('잘못된 id → 400', (await call('/api/admin/guestbook/not-an-id', { method: 'DELETE', headers: A })).status === 400)

  r = await call('/api/auth/logout', { method: 'POST', headers: cookie })
  const setCookie = r.headers.get('set-cookie') ?? ''
  check('로그아웃: 세션 쿠키 만료', /jw_session=;|jw_session=""|Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(setCookie), setCookie.slice(0, 120))

  // 정리
  await Post.deleteMany({ slug: { $in: [secretSlug] } })
  await Guestbook.deleteMany({ name: { $in: ['xss', 'third', 'fourth'] } })
  await mongoose.disconnect()

  console.log(`\n${pass} passed, ${fail} failed\n`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(async (err) => {
  console.error(err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
