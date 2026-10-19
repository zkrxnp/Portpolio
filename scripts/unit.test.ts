/**
 * 서버·DB 없이 도는 단위 테스트: 입력 검증, 케이스 스터디 분류, 활동 연도 묶음.
 */
import { guestbookInput, projectInput, projectQuery, logQuery, postInput, cleanText } from '../lib/validation'
import { toCaseStudy, classifyHeading } from '../lib/caseStudy'
import { groupByYear, activities } from '../lib/activities'
import { renderMarkdown, withHeadingIds, wikiSlug } from '../lib/markdown'

let pass = 0
let fail = 0
function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log('  ok  ', name) }
  else { fail++; console.log('  FAIL', name, extra) }
}
const okParse = (schema: { safeParse: (v: unknown) => { success: boolean } }, v: unknown) => schema.safeParse(v).success

console.log('\n[방명록 입력]')
check('정상 입력 통과', okParse(guestbookInput, { name: '현진', message: '안녕하세요' }))
check('공백만 있는 이름 거부', !okParse(guestbookInput, { name: '   ', message: '안녕하세요' }))
check('공백만 있는 메시지 거부', !okParse(guestbookInput, { name: 'a', message: ' \n\t ' }))
check('보이지 않는 문자만 있는 이름 거부', !okParse(guestbookInput, { name: '​​', message: '안녕하세요' }))
check('메시지 1자 거부', !okParse(guestbookInput, { name: 'a', message: 'x' }))
check('메시지 501자 거부', !okParse(guestbookInput, { name: 'a', message: 'x'.repeat(501) }))
check('이름 41자 거부', !okParse(guestbookInput, { name: 'x'.repeat(41), message: '안녕하세요' }))
check('이름이 문자열이 아니면 거부(연산자 객체)', !okParse(guestbookInput, { name: { $ne: '' }, message: '안녕하세요' }))
const gb = guestbookInput.parse({ name: '  a\n\nb  ', message: '  <script>alert(1)</script>  ' })
check('이름의 줄바꿈은 공백 하나로', gb.name === 'a b', JSON.stringify(gb.name))
check('HTML은 지우지 않고 텍스트로 보관(출력 시 이스케이프)', gb.message === '<script>alert(1)</script>')
check('cleanText: 제어 문자 제거', cleanText('a\u0000b‮c') === 'abc')

console.log('\n[프로젝트 입력: 링크·이미지]')
const base = { title: 't', summary: 's', category: '시스템' }
check('https 저장소 링크 통과', okParse(projectInput, { ...base, links: { repo: 'https://github.com/x/y' } }))
check('javascript: 링크 거부', !okParse(projectInput, { ...base, links: { repo: 'javascript:alert(1)' } }))
check('data: 링크 거부', !okParse(projectInput, { ...base, links: { writeup: 'data:text/html,x' } }))
check('사이트 경로 썸네일 통과', okParse(projectInput, { ...base, thumbnail: '/images/trustgate.png' }))
check('프로토콜 상대 썸네일(//evil) 거부', !okParse(projectInput, { ...base, thumbnail: '//evil.com/x.png' }))
check('http(비암호) 썸네일 거부', !okParse(projectInput, { ...base, thumbnail: 'http://x.com/a.png' }))
check('없는 상태 값 거부', !okParse(projectInput, { ...base, status: 'done' }))

console.log('\n[조회 쿼리]')
check('기본값', JSON.stringify(projectQuery.parse({})) === JSON.stringify({ q: '', category: '', tech: '', status: '', sort: 'featured', page: 1, limit: 12 }))
check('없는 정렬 키 거부', !okParse(projectQuery, { sort: 'password' }))
check('page=0 거부', !okParse(projectQuery, { page: '0' }))
check('limit 상한(50) 초과 거부', !okParse(projectQuery, { limit: '1000' }))
check('없는 분야 거부', !okParse(projectQuery, { category: '해킹' }))
check('검색어 100자 초과 거부', !okParse(logQuery, { q: 'x'.repeat(101) }))
check('기록 정렬 oldest 허용', okParse(logQuery, { sort: 'oldest' }))
check('관련 프로젝트 id 형식 검사', !okParse(postInput, { title: 't', relatedProjectIds: ['../etc'] }))

console.log('\n[케이스 스터디 분류]')
check('배경 → OBJECTIVE', classifyHeading('배경') === 'OBJECTIVE')
check('배운 것 → FINDINGS', classifyHeading('배운 것') === 'FINDINGS')
check('통합 CLI → ANALYSIS', classifyHeading('통합 CLI') === 'ANALYSIS')
const blocks = toCaseStudy('<p>intro</p><h2>목표</h2><p>a</p><h2>막힌 곳</h2><p>b</p><h2>방향 전환</h2><p>c</p><h2>배운 것</h2><p>d</p>')
check('블록 순서와 라벨', blocks.map((b) => b.label).join(',') === ',OBJECTIVE,ANALYSIS,FINDINGS', blocks.map((b) => b.label).join(','))
check('같은 라벨은 한 블록으로 합침', blocks[2].html.includes('막힌 곳') && blocks[2].html.includes('방향 전환'))
check('내용을 바꾸지 않음(이어 붙이면 원본)', blocks.map((b) => b.html).join('') === '<p>intro</p><h2>목표</h2><p>a</p><h2>막힌 곳</h2><p>b</p><h2>방향 전환</h2><p>c</p><h2>배운 것</h2><p>d</p>')
check('h2가 없으면 라벨 없음', toCaseStudy('<p>x</p>')[0].label === null)

console.log('\n[마크다운: 위키링크 · 콜아웃 · 개요]')
const md = (s: string) => renderMarkdown(s).trim()
check('[[slug]] → /go/slug 내부 링크', md('[[trustgate]]').includes('<a class="internal-link" href="/go/trustgate">trustgate</a>'))
check('[[slug|이름]] → 이름 표시', md('[[sudo-nday|sudo 분석]]').includes('>sudo 분석</a>'))
check('코드 안의 [[...]]는 링크 아님', !md('`[[x]]`\n\n```\n[[y]]\n```').includes('internal-link'))
check('위키링크 이름의 HTML은 이스케이프', !md('[[x|<img src=x onerror=alert(1)>]]').includes('<img'))
check('위키링크 경로 조작 무력화', md('[[../../etc/passwd]]').includes('href="/go/etcpasswd"'))
check('콜아웃 [!warning] 렌더', md('> [!warning] 주의\n> 본문').includes('class="callout callout-warning"'))
check('모르는 콜아웃 종류는 note로', md('> [!zzz] t\n> b').includes('callout-note'))
const injected = md('> [!a" onclick="x] t\n> b')
check('따옴표 낀 콜아웃 종류는 콜아웃 아님 · 태그 속성으로 안 들어감', !injected.includes('callout') && !/<[^>]*\sonclick=/i.test(injected), injected)
const toc = withHeadingIds(renderMarkdown('## 하나\n\n### 둘 & 셋'))
check('개요: h2·h3에 id와 목록', toc.headings.length === 2 && toc.headings[1].text === '둘 & 셋' && toc.html.includes('id="sec-2"'))
check('wikiSlug: 공백→하이픈, 기호 제거', wikiSlug(' Trust Gate!! ') === 'trust-gate')

console.log('\n[활동 연도 묶음]')
const groups = groupByYear(activities)
check('기록 수 보존', groups.reduce((n, g) => n + g.items.length, 0) === activities.length)
check('순서 보존', groups.flatMap((g) => g.items).every((a, i) => a === activities[i]))
check('날짜 없는 항목은 앞 연도에 붙음', groups.find((g) => g.items.some((a) => a.title === '안랩 기업 탐방'))?.year === '2025')

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
