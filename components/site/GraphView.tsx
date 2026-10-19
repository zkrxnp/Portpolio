import Link from 'next/link'

type GNode = { id: string; href: string; label: string; kind: 'project' | 'log' }
type Pos = { x: number; y: number; vx: number; vy: number }

const W = 400
const H = 300
const PAD = 46

/**
 * 옵시디언 그래프 뷰처럼 프로젝트(큰 점)와 기록(작은 점)을 relatedProjectIds로 잇습니다.
 * 위치는 서버에서 간단한 힘 시뮬레이션으로 한 번 계산합니다(초기 배치가 고정이라 매번 같은 모양).
 */
function layout(nodes: GNode[], edges: [number, number][]): { x: number; y: number }[] {
  const n = nodes.length
  const p: Pos[] = nodes.map((node, i) => {
    const a = (i / n) * Math.PI * 2
    const r = node.kind === 'project' ? 60 : 130
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0 }
  })
  for (let step = 0; step < 400; step++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = p[i].x - p[j].x
        const dy = p[i].y - p[j].y
        const d2 = Math.max(dx * dx + dy * dy, 25)
        const f = 3200 / d2
        const d = Math.sqrt(d2)
        p[i].vx += (dx / d) * f; p[i].vy += (dy / d) * f
        p[j].vx -= (dx / d) * f; p[j].vy -= (dy / d) * f
      }
    }
    for (const [a, b] of edges) {
      const dx = p[b].x - p[a].x
      const dy = p[b].y - p[a].y
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const f = (d - 60) * 0.05
      p[a].vx += (dx / d) * f; p[a].vy += (dy / d) * f
      p[b].vx -= (dx / d) * f; p[b].vy -= (dy / d) * f
    }
    for (const q of p) {
      q.vx -= q.x * 0.012; q.vy -= q.y * 0.012 // 가운데로 모으는 힘
      q.vx *= 0.6; q.vy *= 0.6
      q.x += q.vx; q.y += q.vy
    }
  }
  // 상자 안에 맞춥니다.
  const xs = p.map((q) => q.x)
  const ys = p.map((q) => q.y)
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const sx = (W - PAD * 2) / Math.max(maxX - minX, 1)
  const sy = (H - PAD * 2) / Math.max(maxY - minY, 1)
  const s = Math.min(sx, sy)
  const ox = (W - (maxX - minX) * s) / 2
  const oy = (H - (maxY - minY) * s) / 2
  return p.map((q) => ({ x: ox + (q.x - minX) * s, y: oy + (q.y - minY) * s }))
}

export function GraphView({
  projects,
  logs,
  className = 'graph',
}: {
  className?: string
  projects: { _id: string; slug: string; title: string }[]
  logs: { slug: string; title: string; relatedProjectIds: string[] }[]
}) {
  const nodes: GNode[] = [
    ...projects.map((p) => ({ id: p._id, href: `/projects/${p.slug}`, label: p.title, kind: 'project' as const })),
    ...logs.map((l) => ({ id: `log:${l.slug}`, href: `/blog/${l.slug}`, label: l.title, kind: 'log' as const })),
  ]
  if (nodes.length === 0) return null

  const index = new Map(nodes.map((n, i) => [n.id, i]))
  const edges: [number, number][] = []
  logs.forEach((l) => {
    const from = index.get(`log:${l.slug}`)!
    for (const pid of l.relatedProjectIds) {
      const to = index.get(pid)
      if (to !== undefined) edges.push([from, to])
    }
  })
  const pos = layout(nodes, edges)

  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`프로젝트 ${projects.length}개와 기록 ${logs.length}개의 연결 그래프`}>
      <g className="g-edges">
        {edges.map(([a, b], i) => (
          <line key={i} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} />
        ))}
      </g>
      {nodes.map((n, i) => (
        <Link key={n.id} href={n.href} className={`g-node ${n.kind}`}>
          <title>{n.label}</title>
          <circle cx={pos[i].x} cy={pos[i].y} r={n.kind === 'project' ? 7.5 : 5} />
          <text x={pos[i].x} y={pos[i].y + (n.kind === 'project' ? 21 : 16)} textAnchor="middle">
            {n.label.length > 16 ? n.label.slice(0, 15) + '…' : n.label}
          </text>
        </Link>
      ))}
    </svg>
  )
}

export default GraphView
