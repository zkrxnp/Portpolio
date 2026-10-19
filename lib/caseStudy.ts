/**
 * 프로젝트 본문(렌더된 HTML)을 h2 단위로 나눠 케이스 스터디 라벨을 붙입니다.
 *
 * 내용을 새로 만들지 않고, 이미 있는 소제목의 이름만 보고 분류합니다.
 * "배경·목표"는 OBJECTIVE, "배운 것·결과·한계·찾은 것"은 FINDINGS, 나머지는 ANALYSIS.
 * 첫 h2 앞에 있는 글은 라벨 없이 둡니다. 같은 라벨이 이어지면 한 블록으로 묶습니다.
 */
export type CaseLabel = 'OBJECTIVE' | 'ANALYSIS' | 'FINDINGS'
export type CaseBlock = { label: CaseLabel | null; html: string }

const OBJECTIVE = /배경|목표|목적/
const FINDINGS = /배운|결과|남은|한계|찾은|성과|정리/

export function classifyHeading(text: string): CaseLabel {
  if (OBJECTIVE.test(text)) return 'OBJECTIVE'
  if (FINDINGS.test(text)) return 'FINDINGS'
  return 'ANALYSIS'
}

export function toCaseStudy(html: string): CaseBlock[] {
  const blocks: CaseBlock[] = []
  for (const part of html.split(/(?=<h2[\s>])/)) {
    if (!part.trim()) continue
    const heading = part.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/)
    const label = heading ? classifyHeading(heading[1].replace(/<[^>]+>/g, '')) : null
    const prev = blocks[blocks.length - 1]
    if (prev && prev.label === label) prev.html += part
    else blocks.push({ label, html: part })
  }
  return blocks
}
