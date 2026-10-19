import dbConnect from './mongodb'
import Project from './models/Project'
import Post from './models/Post'
import { activities, groupByYear, type Activity } from './activities'
import { renderMarkdown, withHeadingIds, wikiSlug, type Heading } from './markdown'
import { toCaseStudy } from './caseStudy'

/**
 * 옵시디언식 작업 공간의 "노트 저장소".
 *
 * 노트는 전부 실제 데이터에서 만듭니다.
 *   project:<slug>   MongoDB projects (공개분)
 *   log:<slug>       MongoDB posts (공개분) = Research Log
 *   tag:<slug>       프로젝트 기술 스택 + 기록 태그 (기술 개념 노드)
 *   activity:<id>    lib/activities.ts (Notion 기준 활동 기록)
 *   page:<id>        소개·방명록·연락
 *
 * 연결(edge)은 등록된 관계만 씁니다. 파일 이름으로 관계를 추측하지 않습니다.
 *   related   기록 → 프로젝트 (relatedProjectIds, ObjectId 기준)
 *   wikilink  본문에 직접 쓴 [[slug]] 또는 /projects·/blog 링크
 *   tag       노트 → 기술·태그
 *   activity  활동 노트 → 프로젝트 (활동 항목에 등록된 링크)
 */

export type NoteKind = 'project' | 'log' | 'tag' | 'activity' | 'page'
export type NoteMeta = {
  id: string
  kind: NoteKind
  title: string
  path: string // 탐색기 경로 (예: Projects/TrustGate.md)
  category?: string
  tags: string[]
}
export type EdgeKind = 'related' | 'wikilink' | 'tag' | 'activity'
export type Edge = { source: string; target: string; kind: EdgeKind }
export type NoteRef = { id: string; title: string; kind: NoteKind }
export type Property = { label: string; text?: string; links?: NoteRef[]; href?: string }
export type NoteDetail = NoteMeta & {
  properties: Property[]
  html: string
  headings: Heading[]
  outgoing: NoteRef[]
  backlinks: NoteRef[]
  relatedProjects: NoteRef[]
  tagRefs: NoteRef[]
  unresolved: string[]
  special?: 'guestbook' | 'contact'
  dbId?: string // 관리자 편집 링크용
  pageUrl?: string // 일반 페이지 주소(검색 노출·공유용)
}

const KIND_LABEL: Record<NoteKind, string> = {
  project: '프로젝트', log: '연구 기록', tag: '기술·태그', activity: '활동', page: '페이지',
}
export const kindLabel = (k: NoteKind) => KIND_LABEL[k]

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const tagId = (t: string) => `tag:${wikiSlug(t) || 'tag'}`

type ProjectRow = {
  _id: unknown; slug: string; title: string; summary: string; body?: string; category: string
  status?: string; period?: string; role?: string; stack?: string[]; links?: { repo?: string; writeup?: string }
}
type LogRow = {
  _id: unknown; slug: string; title: string; excerpt?: string; body?: string; category?: string
  tags?: string[]; relatedProjectIds?: unknown[]; publishedAt?: Date | null; readingMinutes?: number
}

type Vault = {
  notes: NoteMeta[]
  byId: Map<string, NoteMeta>
  edges: Edge[]
  projects: ProjectRow[]
  logs: LogRow[]
}

/** 본문에서 직접 쓴 참조(위키링크·사이트 내부 링크)만 뽑습니다. 코드 안의 것은 제외. */
function explicitRefs(md: string): string[] {
  const text = (md ?? '').replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
  const out: string[] = []
  for (const m of text.matchAll(/\[\[([^\]|\n]{1,120})(?:\|[^\]\n]{1,120})?\]\]/g)) out.push(`wiki:${wikiSlug(m[1])}`)
  for (const m of text.matchAll(/\]\(\/(projects|blog)\/([^)\s#?]+)\)/g)) out.push(`${m[1] === 'projects' ? 'project' : 'log'}:${decodeURIComponent(m[2])}`)
  return out
}

const fileSafe = (t: string) => t.split('/').join('\u2215')

export async function loadVault(): Promise<Vault> {
  let projects: ProjectRow[] = []
  let logs: LogRow[] = []
  try {
    await dbConnect()
    ;[projects, logs] = await Promise.all([
      Project.find({ published: true }).sort({ featured: -1, order: 1, createdAt: -1 }).lean<ProjectRow[]>(),
      Post.find({ published: true }).sort({ publishedAt: -1 }).lean<LogRow[]>(),
    ])
  } catch (err) {
    // DB가 없으면 정적 노트(소개·활동)만으로라도 작업 공간을 띄웁니다.
    console.error('[vault] DB 조회 실패 — 정적 노트만 표시합니다.', err)
  }

  const notes: NoteMeta[] = []
  const edges: Edge[] = []
  const add = (n: NoteMeta) => notes.push(n)

  add({ id: 'page:about', kind: 'page', title: '소개', path: '소개.md', tags: [] })

  for (const p of projects) {
    add({ id: `project:${p.slug}`, kind: 'project', title: p.title, path: `Projects/${fileSafe(p.title)}.md`, category: p.category, tags: p.stack ?? [] })
  }
  for (const l of logs) {
    const cat = l.category ?? '기타'
    add({ id: `log:${l.slug}`, kind: 'log', title: l.title, path: `Research/${cat}/${fileSafe(l.title)}.md`, category: cat, tags: l.tags ?? [] })
  }

  add({ id: 'activity:timeline', kind: 'activity', title: '타임라인', path: 'Activity/타임라인.md', tags: [] })
  add({ id: 'activity:presentations', kind: 'activity', title: '발표', path: 'Activity/발표.md', tags: [] })
  add({ id: 'activity:ctf', kind: 'activity', title: 'CTF', path: 'Activity/CTF.md', tags: [] })

  // 기술·태그 노트: 실제로 쓰인 것만
  const tagNames = new Map<string, string>()
  for (const n of notes) for (const t of n.tags) if (!tagNames.has(tagId(t))) tagNames.set(tagId(t), t)
  for (const [id, name] of [...tagNames].sort((a, b) => a[1].localeCompare(b[1]))) {
    add({ id, kind: 'tag', title: name, path: `Tags/${fileSafe(name)}.md`, tags: [] })
  }

  add({ id: 'page:guestbook', kind: 'page', title: '방명록', path: '방명록.md', tags: [] })
  add({ id: 'page:contact', kind: 'page', title: '연락', path: '연락.md', tags: [] })

  const byId = new Map(notes.map((n) => [n.id, n]))
  const projectByObjectId = new Map(projects.map((p) => [String(p._id), `project:${p.slug}`]))
  const resolveWiki = (slug: string) =>
    byId.has(`project:${slug}`) ? `project:${slug}` : byId.has(`log:${slug}`) ? `log:${slug}` : null

  const pushEdge = (source: string, target: string, kind: EdgeKind) => {
    if (source === target || !byId.has(source) || !byId.has(target)) return
    if (!edges.some((e) => e.source === source && e.target === target && e.kind === kind)) edges.push({ source, target, kind })
  }
  const refsOf = (from: string, md: string) => {
    for (const r of explicitRefs(md)) {
      const target = r.startsWith('wiki:') ? resolveWiki(r.slice(5)) : r
      if (target) pushEdge(from, target, 'wikilink')
    }
  }

  for (const p of projects) {
    const id = `project:${p.slug}`
    for (const t of p.stack ?? []) pushEdge(id, tagId(t), 'tag')
    refsOf(id, p.body ?? '')
  }
  for (const l of logs) {
    const id = `log:${l.slug}`
    for (const pid of l.relatedProjectIds ?? []) {
      const target = projectByObjectId.get(String(pid))
      if (target) pushEdge(id, target, 'related')
    }
    for (const t of l.tags ?? []) pushEdge(id, tagId(t), 'tag')
    refsOf(id, l.body ?? '')
  }
  const activityGroup = (a: Activity) =>
    a.kind === '발표' ? 'activity:presentations' : a.kind === 'CTF' || a.kind === '수상' ? 'activity:ctf' : null
  for (const a of activities) {
    const m = a.href?.match(/^\/projects\/(.+)$/)
    if (!m) continue
    pushEdge('activity:timeline', `project:${m[1]}`, 'activity')
    const g = activityGroup(a)
    if (g) pushEdge(g, `project:${m[1]}`, 'activity')
  }

  return { notes, byId, edges, projects, logs }
}

const ref = (v: Vault, id: string): NoteRef | null => {
  const n = v.byId.get(id)
  return n ? { id: n.id, title: n.title, kind: n.kind } : null
}
const refs = (v: Vault, ids: string[]) => ids.map((id) => ref(v, id)).filter((r): r is NoteRef => r !== null)

/**
 * 렌더된 본문의 내부 링크를 노트 링크로 바꿉니다.
 * - [[slug]] (href="/go/slug"): 있는 노트면 data-note, 없으면 is-unresolved 로 표시
 * - /projects/slug, /blog/slug 링크: 노트가 있으면 data-note
 * 붙이는 값은 우리가 만든 노트 ID뿐이라 사용자 입력이 속성으로 들어가지 않습니다.
 */
function linkify(v: Vault, html: string, unresolved: string[]): string {
  const resolve = (slug: string) =>
    v.byId.has(`project:${slug}`) ? `project:${slug}` : v.byId.has(`log:${slug}`) ? `log:${slug}` : null
  return html
    .replace(/<a class="internal-link" href="\/go\/([^"]+)">/g, (_m, enc: string) => {
      const slug = wikiSlug(decodeURIComponent(enc))
      const id = resolve(slug)
      if (id) return `<a class="internal-link" href="/?note=${encodeURIComponent(id)}" data-note="${esc(id)}">`
      unresolved.push(slug)
      return `<a class="internal-link is-unresolved" href="/go/${enc}" title="아직 없는 노트입니다">`
    })
    .replace(/<a href="\/(projects|blog)\/([^"#?]+)"/g, (m, kind: string, enc: string) => {
      const id = `${kind === 'projects' ? 'project' : 'log'}:${decodeURIComponent(enc)}`
      return v.byId.has(id) ? `<a href="/?note=${encodeURIComponent(id)}" data-note="${esc(id)}"` : m
    })
}

const noteLink = (r: NoteRef) =>
  `<a class="internal-link" href="/?note=${encodeURIComponent(r.id)}" data-note="${esc(r.id)}">${esc(r.title)}</a>`

function activityHtml(v: Vault, list: Activity[]): string {
  return groupByYear(list)
    .map((g) => {
      const items = g.items
        .map((a) => {
          const m = a.href?.match(/^\/projects\/(.+)$/)
          const target = m ? ref(v, `project:${m[1]}`) : null
          const title = target ? noteLink({ ...target, title: a.title }) : esc(a.title)
          return `<li><code>${esc(a.date || '날짜 미기재')}</code> <strong>${esc(a.kind)}</strong> ${title}${a.detail ? ` — ${esc(a.detail)}` : ''}</li>`
        })
        .join('')
      return `<h2>${esc(g.year)}</h2><ul>${items}</ul>`
    })
    .join('')
}

/** 노트 하나를 화면에 필요한 모양으로. 없으면 null. */
export async function getNoteDetail(id: string, vault?: Vault): Promise<NoteDetail | null> {
  const v = vault ?? (await loadVault())
  const meta = v.byId.get(id)
  if (!meta) return null

  const outgoingIds = v.edges.filter((e) => e.source === id).map((e) => e.target)
  const backIds = v.edges.filter((e) => e.target === id).map((e) => e.source)
  const neighbors = [...new Set([...outgoingIds, ...backIds])]
  const unresolved: string[] = []
  let properties: Property[] = []
  let html = ''
  let dbId: string | undefined
  let pageUrl: string | undefined
  let special: NoteDetail['special']

  if (meta.kind === 'project') {
    const p = v.projects.find((x) => `project:${x.slug}` === id)!
    dbId = String(p._id)
    pageUrl = `/projects/${p.slug}`
    properties = [
      { label: '유형', text: '프로젝트' },
      { label: '분야', text: p.category },
      { label: '상태', text: p.status ?? '완료' },
      ...(p.period ? [{ label: '기간', text: p.period }] : []),
      ...(p.role ? [{ label: '역할', text: p.role }] : []),
      { label: '기술', links: refs(v, (p.stack ?? []).map(tagId)) },
      ...(p.links?.repo ? [{ label: 'GitHub', href: p.links.repo, text: p.links.repo.replace(/^https?:\/\//, '') }] : []),
      ...(p.links?.writeup ? [{ label: '글', href: p.links.writeup, text: '라이트업' }] : []),
    ]
    // 본문 소제목에 케이스 스터디 라벨만 붙입니다(내용은 그대로).
    const blocks = toCaseStudy(renderMarkdown(p.body ?? ''))
    const summary = `<p class="note-summary">${esc(p.summary)}</p>`
    html = summary + blocks.map((b) => (b.label ? `<p class="cs-tag">${b.label}</p>` : '') + b.html).join('')
  } else if (meta.kind === 'log') {
    const l = v.logs.find((x) => `log:${x.slug}` === id)!
    dbId = String(l._id)
    pageUrl = `/blog/${l.slug}`
    const related = (l.relatedProjectIds ?? [])
      .map((pid) => v.projects.find((p) => String(p._id) === String(pid)))
      .filter((p): p is ProjectRow => !!p)
    properties = [
      { label: '유형', text: '연구 기록' },
      { label: '분류', text: l.category ?? '기타' },
      { label: '태그', links: refs(v, (l.tags ?? []).map(tagId)) },
      ...(l.publishedAt ? [{ label: '발행', text: new Date(l.publishedAt).toLocaleDateString('ko-KR') }] : []),
      { label: '분량', text: `${l.readingMinutes ?? 1}분` },
      ...(related.length ? [{ label: '관련 프로젝트', links: refs(v, related.map((p) => `project:${p.slug}`)) }] : []),
    ]
    html = (l.excerpt ? `<p class="note-summary">${esc(l.excerpt)}</p>` : '') + renderMarkdown(l.body ?? '')
  } else if (meta.kind === 'tag') {
    const users = refs(v, backIds)
    properties = [{ label: '유형', text: '기술·태그' }, { label: '쓰인 곳', text: `${users.length}개 노트` }]
    html = `<p class="note-summary">이 기술·태그가 붙은 노트입니다. 프로젝트의 기술 스택과 기록의 태그에서 모았습니다.</p>` +
      `<ul>${users.map((u) => `<li>${noteLink(u)} <small>${esc(kindLabel(u.kind))}</small></li>`).join('')}</ul>`
  } else if (meta.kind === 'activity') {
    const list =
      id === 'activity:presentations' ? activities.filter((a) => a.kind === '발표')
      : id === 'activity:ctf' ? activities.filter((a) => a.kind === 'CTF' || a.kind === '수상')
      : activities
    properties = [{ label: '유형', text: '활동' }, { label: '기록', text: `${list.length}건` }]
    html = activityHtml(v, list)
  } else if (id === 'page:about') {
    const count = (k: Activity['kind']) => activities.filter((a) => a.kind === k).length
    properties = [
      { label: '이름', text: '정현진 (Jeong Hyeonjin)' },
      { label: '소속', text: '중부대학교 정보보호학전공 · 2025.03 — 재학 중' },
      { label: '공부하는 분야', text: '리버싱, 시스템 해킹' },
      { label: 'GitHub', href: 'https://github.com/zkrxnp', text: 'github.com/zkrxnp' },
      { label: '블로그', href: 'https://hjstu.tistory.com/', text: 'hjstu.tistory.com' },
    ]
    // 프로젝트가 DB에 없으면(비공개 등) 링크 대신 이름만 남깁니다.
    const proj = (slug: string, fallback: string) => {
      const n = v.notes.find((x) => x.id === `project:${slug}`)
      if (!n) return esc(fallback)
      outgoingIds.push(n.id) // 본문에서 거는 링크도 "이 노트가 참조하는 노트"에 보이게
      return noteLink(n)
    }
    const timeline = noteLink({ id: 'activity:timeline', title: '타임라인', kind: 'activity' })
    html =
      `<p class="note-summary">프로그램이 동작하는 원리를 파악하는 데 관심이 있어 바이너리 분석과 시스템 취약점 분석을 공부하고 있습니다. ` +
      `최근에는 AI 에이전트 보안과 레드티밍으로 관심을 넓혀가고 있으며, 직접 실험하면서 취약점이 발생하는 원인과 동작 과정을 알아가고 있습니다.</p>` +
      `<h2>관심 분야</h2><ul>` +
      `<li><strong>리버싱</strong> — 디버거로 실행 흐름을 따라가고, 어셈블리 수준에서 동작을 바꿔 봅니다. (${proj('minesweeper-reversing', '지뢰찾기 리버싱')})</li>` +
      `<li><strong>시스템 해킹</strong> — 권한 상승 취약점이 왜 생겼는지 원인과 패치를 분석하고, 퍼징으로 새 취약점을 찾는 방법을 공부합니다. (${proj('sudo-nday', 'sudo N-day 분석')})</li>` +
      `<li><strong>소프트웨어 공급망</strong> — 패키지가 원래 저장소의 정상 빌드에서 나왔는지 검증하는 도구를 만들었습니다. (${proj('trustgate', 'TrustGate')})</li>` +
      `<li><strong>AI 보안</strong> — 모델이 가진 권한과 입력을 신뢰하는 방식이 시스템 보안과 같은 구조라는 점에 관심을 두고, 프롬프트 인젝션을 주제로 발표했습니다.</li>` +
      `</ul>` +
      `<h2>주요 경험</h2><table><thead><tr><th>기간</th><th>내용</th><th>역할</th></tr></thead><tbody>` +
      `<tr><td>2026.06 — 09</td><td>${proj('trustgate', 'TrustGate')} — npm 릴리스 계보 검증 도구</td><td>팀장 · 수집기 · 탐지 규칙</td></tr>` +
      `<tr><td>2025.12 — 2026.02</td><td>${proj('sudo-nday', 'sudo 취약점 탐색과 N-day 분석')}</td><td>CVE-2023-22809 분석</td></tr>` +
      `<tr><td>2025.10 — 12</td><td>${proj('aws-devsecops-pipeline', 'AWS CI/CD 보안 파이프라인')} — SAST·SCA·DAST 자동화</td><td>PM</td></tr>` +
      `<tr><td>2026.01</td><td>${proj('minesweeper-reversing', '지뢰찾기 리버싱')} — 명지대 합동 세미나 발표</td><td>분석 · 발표</td></tr>` +
      `</tbody></table>` +
      `<h2>발표</h2><ul>` +
      `<li>2026.09.30 · S.C.P 세미나 — House of Spirit 취약점</li>` +
      `<li>2026.04.14 · 오픈 세미나 — 프롬프트 인젝션 공격 기법과 방어 방안</li>` +
      `<li>2026.01.12 · 명지대 합동 세미나 — 지뢰찾기 리버싱</li>` +
      `</ul>` +
      `<h2>기술</h2><table><tbody>` +
      `<tr><th>언어</th><td><code>C</code> <code>Python</code> <code>x86 Assembly</code></td></tr>` +
      `<tr><th>분석</th><td><code>OllyDbg</code> <code>AFL++</code> <code>ASan</code> <code>Semgrep</code></td></tr>` +
      `<tr><th>환경 · 인프라</th><td><code>Docker</code> <code>AWS</code> <code>GitHub API</code> <code>Sigstore</code></td></tr>` +
      `</tbody></table>` +
      `<h2>활동 요약</h2><p>프로젝트 ${count('프로젝트')} · 발표 ${count('발표')} · CTF ${count('CTF')} · 수상 ${count('수상')} — 전체 기록은 ${timeline}에 있습니다.</p>`
  } else if (id === 'page:guestbook') {
    special = 'guestbook'
    properties = [{ label: '유형', text: '페이지' }]
  } else if (id === 'page:contact') {
    special = 'contact'
    properties = [
      { label: '메일', href: 'mailto:cookcoo150@naver.com', text: 'cookcoo150@naver.com' },
      { label: 'GitHub', href: 'https://github.com/zkrxnp', text: 'github.com/zkrxnp' },
      { label: '블로그', href: 'https://hjstu.tistory.com/', text: 'hjstu.tistory.com' },
    ]
  }

  const linked = withHeadingIds(linkify(v, html, unresolved))
  return {
    ...meta,
    properties,
    html: linked.html,
    headings: linked.headings,
    outgoing: refs(v, [...new Set(outgoingIds)].filter((x) => !x.startsWith('tag:'))),
    backlinks: refs(v, [...new Set(backIds)]),
    relatedProjects: refs(v, neighbors.filter((x) => x.startsWith('project:'))),
    tagRefs: refs(v, neighbors.filter((x) => x.startsWith('tag:'))),
    unresolved: [...new Set(unresolved)],
    special,
    dbId,
    pageUrl,
  }
}

/** 그래프용: 노드와 연결선. 방명록·연락처럼 연결이 없는 페이지는 뺍니다. */
export function toGraph(v: Vault) {
  const nodes = v.notes
    .filter((n) => n.id !== 'page:guestbook' && n.id !== 'page:contact')
    .map((n) => ({ id: n.id, title: n.title, kind: n.kind, category: n.category ?? kindLabel(n.kind) }))
  return { nodes, links: v.edges }
}

/** id 문자열 검사: 종류:슬러그 꼴만 받습니다. */
export function parseNoteId(raw: string): string | null {
  const m = /^(project|log|tag|activity|page):([^\s/]{1,160})$/.exec(raw)
  return m ? `${m[1]}:${m[2]}` : null
}
