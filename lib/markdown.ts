import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

marked.setOptions({ gfm: true, breaks: true })

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
  const raw = marked.parse(src ?? '', { async: false }) as string
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'p','br','hr','h1','h2','h3','h4','h5','h6','strong','em','del','code','pre',
      'blockquote','ul','ol','li','a','img','table','thead','tbody','tr','th','td','span',
    ],
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#|\/)/i,
  })
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
