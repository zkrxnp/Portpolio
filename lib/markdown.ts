import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

marked.setOptions({ gfm: true, breaks: true })

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** [[대상]]의 대상을 슬러그 모양으로. 실제 문서는 /go/<slug>가 서버에서 찾아갑니다. */
export function wikiSlug(target: string): string {
  return target.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣\-]/g, '').slice(0, 140)
}

/**
 * 옵시디언 위키링크: [[slug]] 또는 [[slug|보일 이름]].
 * 파서 확장으로 넣어서 코드 블록·인라인 코드 안의 [[...]]는 건드리지 않습니다.
 */
marked.use({
  extensions: [
    {
      name: 'wikilink',
      level: 'inline',
      start(src: string) {
        const i = src.indexOf('[[')
        return i < 0 ? undefined : i
      },
      tokenizer(src: string) {
        const m = /^\[\[([^\]|\n]{1,120})(?:\|([^\]\n]{1,120}))?\]\]/.exec(src)
        if (!m) return undefined
        return { type: 'wikilink', raw: m[0], target: m[1], label: (m[2] ?? m[1]).trim() }
      },
      renderer(token) {
        const slug = wikiSlug(String(token.target))
        if (!slug) return escapeHtml(String(token.raw))
        return `<a class="internal-link" href="/go/${encodeURIComponent(slug)}">${escapeHtml(String(token.label))}</a>`
      },
    },
  ],
})

const CALLOUTS = new Set(['note', 'info', 'tip', 'success', 'question', 'warning', 'danger', 'bug', 'example', 'quote', 'abstract', 'failure'])

/**
 * 옵시디언 콜아웃: 인용문 첫 줄이 [!종류] 제목 이면 색 있는 상자로 바꿉니다.
 *   > [!warning] 주의
 *   > 본문
 * 제목은 marked가 이미 이스케이프한 텍스트이고, 결과는 그대로 DOMPurify를 한 번 더 거칩니다.
 */
function callouts(html: string): string {
  return html.replace(
    /<blockquote>\s*<p>\[!([a-zA-Z]{1,20})\][+-]?[ \t]*([^<\n]*)(?:<br>\s*)?/g,
    (_m, type: string, title: string) => {
      const t = type.toLowerCase()
      const kind = CALLOUTS.has(t) ? t : 'note'
      return `<blockquote class="callout callout-${kind}"><p class="callout-title">${title.trim() || kind.toUpperCase()}</p><p>`
    },
  )
}

/**
 * 본문은 관리자만 쓰지만, 계정이 털리면 그대로 저장형 XSS가 되므로
 * 렌더 직전에 한 번 더 걸러냅니다.
 */
let hookInstalled = false

function installHook() {
  if (hookInstalled) return
  hookInstalled = true
  // target="_blank"만 있고 rel이 없으면 열린 창이 opener를 건드릴 수 있습니다.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

export function renderMarkdown(src: string): string {
  installHook()
  const raw = callouts(marked.parse(src ?? '', { async: false }) as string)
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'p','br','hr','h1','h2','h3','h4','h5','h6','strong','em','del','code','pre',
      'blockquote','ul','ol','li','a','img','table','thead','tbody','tr','th','td','span',
    ],
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#|\/)/i,
  })
}

export type Heading = { id: string; level: 2 | 3; text: string }

/**
 * 개요(Outline) 패널용. 정리(sanitize)가 끝난 HTML의 h2·h3에 id를 붙이고 목록을 돌려줍니다.
 * id는 우리가 만든 sec-N이라 사용자 입력이 속성으로 들어가지 않습니다.
 */
export function withHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = []
  const out = html.replace(/<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/g, (_m, lv: string, attrs: string, inner: string) => {
    const id = `sec-${headings.length + 1}`
    const text = inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
    headings.push({ id, level: Number(lv) as 2 | 3, text })
    return `<h${lv}${attrs} id="${id}">${inner}</h${lv}>`
  })
  return { html: out, headings }
}

/** 상태 표시줄용 단어·글자 수(마크다운 기호와 코드 블록은 뺍니다). */
export function textStats(markdownBody: string): { words: number; chars: number } {
  const text = (markdownBody ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~[\]()|!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return { words: text ? text.split(' ').length : 0, chars: text.replace(/\s/g, '').length }
}

export function excerptFrom(markdownBody: string, max = 180): string {
  const text = (markdownBody ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}
