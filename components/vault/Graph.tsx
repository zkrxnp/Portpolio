'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation,
  type Simulation, type SimulationLinkDatum, type SimulationNodeDatum,
} from 'd3-force'
import { Maximize, RotateCcw, Search } from 'lucide-react'

export type GNode = { id: string; title: string; kind: string; category: string }
export type GLink = { source: string; target: string; kind: string }

type SimNode = GNode & SimulationNodeDatum
type SimLink = SimulationLinkDatum<SimNode> & { kind: string }

const KIND_NAME: Record<string, string> = { project: '프로젝트', log: '연구 기록', tag: '기술·태그', activity: '활동', page: '페이지' }

/**
 * 노드 위치 기억. 탭을 바꾸거나 패널을 다시 열어도 사용자가 옮긴 자리가 초기화되지 않게
 * 모듈 단위로 보관합니다(fx·fy가 있으면 고정된 노드).
 */
const positions = new Map<string, { x: number; y: number; fx?: number | null; fy?: number | null }>()

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Graph({
  nodes,
  links,
  activeId,
  onOpen,
  mode = 'global',
}: {
  nodes: GNode[]
  links: GLink[]
  activeId?: string | null
  onOpen: (id: string) => void
  mode?: 'global' | 'local'
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null)
  const nodesRef = useRef<SimNode[]>([])
  const linksRef = useRef<SimLink[]>([])
  const [, setFrame] = useState(0)
  const [size, setSize] = useState({ w: 600, h: 400 })
  const [view, setView] = useState({ x: 300, y: 200, k: 1 })
  const [hover, setHover] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showTags, setShowTags] = useState(mode === 'local')
  const drag = useRef<{ id?: string; panning?: boolean; sx: number; sy: number; vx: number; vy: number; moved: boolean } | null>(null)

  // 표시할 노드: 로컬 그래프는 현재 노트와 바로 이웃만, 전체 그래프는 태그 표시 여부에 따라
  const visible = useMemo(() => {
    let ns = nodes
    if (mode === 'local' && activeId) {
      const near = new Set([activeId])
      for (const l of links) {
        if (l.source === activeId) near.add(l.target)
        if (l.target === activeId) near.add(l.source)
      }
      ns = nodes.filter((n) => near.has(n.id))
    }
    if (!showTags) ns = ns.filter((n) => n.kind !== 'tag' || n.id === activeId)
    const ids = new Set(ns.map((n) => n.id))
    return { nodes: ns, links: links.filter((l) => ids.has(l.source) && ids.has(l.target)) }
  }, [nodes, links, mode, activeId, showTags])

  // 크기 추적
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setSize({ w: Math.max(width, 100), h: Math.max(height, 100) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fit = useCallback(() => {
    const ns = nodesRef.current
    if (!ns.length) return
    const xs = ns.map((n) => n.x ?? 0)
    const ys = ns.map((n) => n.y ?? 0)
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const pad = 60
    const k = Math.max(0.25, Math.min(2.2, Math.min(size.w / (maxX - minX + pad * 2), size.h / (maxY - minY + pad * 2))))
    setView({ k, x: size.w / 2 - ((minX + maxX) / 2) * k, y: size.h / 2 - ((minY + maxY) / 2) * k })
  }, [size])

  // 시뮬레이션: 보이는 노드가 바뀔 때만 다시 만듭니다. 위치는 positions에서 이어받습니다.
  useEffect(() => {
    const ns: SimNode[] = visible.nodes.map((n, i) => {
      const p = positions.get(n.id)
      const a = (i / Math.max(visible.nodes.length, 1)) * Math.PI * 2
      return { ...n, x: p?.x ?? Math.cos(a) * 120, y: p?.y ?? Math.sin(a) * 120, fx: p?.fx ?? null, fy: p?.fy ?? null }
    })
    const ls: SimLink[] = visible.links.map((l) => ({ source: l.source, target: l.target, kind: l.kind }))
    nodesRef.current = ns
    linksRef.current = ls

    const sim = forceSimulation<SimNode, SimLink>(ns)
      .force('link', forceLink<SimNode, SimLink>(ls).id((d) => d.id).distance((l) => (l.kind === 'tag' ? 70 : 105)).strength(0.5))
      .force('charge', forceManyBody<SimNode>().strength(mode === 'local' ? -280 : -300))
      .force('center', forceCenter(0, 0).strength(0.05))
      .force('collide', forceCollide<SimNode>(26))
      .alpha(ns.every((n) => positions.has(n.id)) ? 0.15 : 1)

    let raf = 0
    sim.on('tick', () => {
      for (const n of ns) positions.set(n.id, { x: n.x!, y: n.y!, fx: n.fx, fy: n.fy })
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setFrame((f) => f + 1))
    })
    // 다 자리 잡은 뒤에도 아주 조금 움직이게(옵시디언의 미세한 흔들림). 모션 줄이기면 끔.
    sim.on('end', () => {
      if (!reducedMotion()) sim.alphaTarget(0.004).restart()
    })
    simRef.current = sim
    const t = setTimeout(fit, ns.every((n) => positions.has(n.id)) ? 0 : 900)
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(raf)
      sim.stop()
    }
    // fit은 크기 변화로도 바뀌므로 의존성에서 뺍니다(재시뮬레이션 방지).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mode])

  // 화면 좌표 → 그래프 좌표
  const toGraph = (clientX: number, clientY: number) => {
    const r = wrapRef.current!.getBoundingClientRect()
    return { x: (clientX - r.left - view.x) / view.k, y: (clientY - r.top - view.y) / view.k }
  }

  function onWheel(e: React.WheelEvent) {
    const r = wrapRef.current!.getBoundingClientRect()
    const px = e.clientX - r.left
    const py = e.clientY - r.top
    const k = Math.max(0.2, Math.min(4, view.k * Math.exp(-e.deltaY * 0.0015)))
    setView({ k, x: px - ((px - view.x) / view.k) * k, y: py - ((py - view.y) / view.k) * k })
  }

  function onPointerDown(e: React.PointerEvent, id?: string) {
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    drag.current = { id, panning: !id, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false }
    if (id) {
      const n = nodesRef.current.find((x) => x.id === id)
      if (n) { n.fx = n.x; n.fy = n.y }
      simRef.current?.alphaTarget(0.3).restart()
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 3) d.moved = true
    if (d.panning) {
      setView((v) => ({ ...v, x: d.vx + (e.clientX - d.sx), y: d.vy + (e.clientY - d.sy) }))
    } else if (d.id) {
      const n = nodesRef.current.find((x) => x.id === d.id)
      if (n) {
        const p = toGraph(e.clientX, e.clientY)
        n.fx = p.x; n.fy = p.y
      }
    }
  }

  function onPointerUp() {
    const d = drag.current
    drag.current = null
    if (!d) return
    simRef.current?.alphaTarget(reducedMotion() ? 0 : 0.004)
    // 끌지 않고 누르기만 했으면 노트를 엽니다. 끌었으면 놓은 자리에 고정해 둡니다.
    if (d.id && !d.moved) {
      const n = nodesRef.current.find((x) => x.id === d.id)
      if (n && !positions.get(d.id)?.fx) { n.fx = null; n.fy = null }
      onOpen(d.id)
    }
  }

  function reset() {
    for (const n of nodesRef.current) { n.fx = null; n.fy = null; positions.delete(n.id) }
    setQuery('')
    simRef.current?.alpha(1).restart()
    setTimeout(fit, 900)
  }

  // 강조: 올린 노드(없으면 현재 노트)와 바로 연결된 것만 밝게
  const focusId = hover ?? (mode === 'global' ? activeId ?? null : null)
  const near = useMemo(() => {
    if (!focusId) return null
    const s = new Set([focusId])
    for (const l of linksRef.current) {
      const a = typeof l.source === 'object' ? (l.source as SimNode).id : String(l.source)
      const b = typeof l.target === 'object' ? (l.target as SimNode).id : String(l.target)
      if (a === focusId) s.add(b)
      if (b === focusId) s.add(a)
    }
    return s
    // linksRef는 시뮬레이션마다 바뀌므로 visible에 묶습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, visible])
  const term = query.trim().toLowerCase()
  const match = (n: GNode) => !term || n.title.toLowerCase().includes(term)

  function onSearchKey(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    const n = nodesRef.current.find((x) => match(x))
    if (n) setView((v) => ({ ...v, x: size.w / 2 - (n.x ?? 0) * v.k, y: size.h / 2 - (n.y ?? 0) * v.k }))
  }

  const hovered = hover ? nodesRef.current.find((n) => n.id === hover) : null

  return (
    <div className={`vgraph ${mode}`}>
      <div className="vgraph-tools">
        <label className="vgraph-search">
          <Search aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onSearchKey} placeholder="그래프 검색" aria-label="그래프에서 노드 검색" />
        </label>
        {mode === 'global' && (
          <label className="vgraph-check">
            <input type="checkbox" checked={showTags} onChange={(e) => setShowTags(e.target.checked)} /> 태그
          </label>
        )}
        <button type="button" onClick={fit} title="화면에 맞추기" aria-label="화면에 맞추기"><Maximize /></button>
        <button type="button" onClick={reset} title="초기화(고정 풀기)" aria-label="그래프 초기화"><RotateCcw /></button>
      </div>

      <div
        ref={wrapRef}
        className="vgraph-canvas"
        onWheel={onWheel}
        onPointerDown={(e) => onPointerDown(e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => { if (!drag.current) setHover(null) }}
      >
        <svg width={size.w} height={size.h} role="img" aria-label={`노트 ${visible.nodes.length}개, 연결 ${visible.links.length}개`}>
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            {linksRef.current.map((l, i) => {
              const s = l.source as SimNode
              const t = l.target as SimNode
              if (typeof s !== 'object' || typeof t !== 'object') return null
              const on = near ? near.has(s.id) && near.has(t.id) : true
              return <line key={i} className={`vl ${l.kind}${on ? '' : ' dim'}`} x1={s.x} y1={s.y} x2={t.x} y2={t.y} />
            })}
            {nodesRef.current.map((n) => {
              const dim = (near && !near.has(n.id)) || !match(n)
              const showLabel = n.kind !== 'tag' || view.k > 1.15 || (near?.has(n.id) ?? false) || (term && match(n))
              const r = n.kind === 'project' ? 7 : n.kind === 'tag' ? 3.5 : n.kind === 'activity' ? 6 : 5
              return (
                <g
                  key={n.id}
                  className={`vn k-${n.kind}${dim ? ' dim' : ''}${n.id === activeId ? ' active' : ''}${n.fx != null ? ' pinned' : ''}`}
                  transform={`translate(${n.x},${n.y})`}
                  tabIndex={0}
                  role="link"
                  aria-label={`${n.title} (${KIND_NAME[n.kind] ?? n.kind}) 열기`}
                  onPointerDown={(e) => onPointerDown(e, n.id)}
                  onPointerEnter={() => setHover(n.id)}
                  onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                  onFocus={() => setHover(n.id)}
                  onBlur={() => setHover(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onOpen(n.id) }}
                >
                  <circle r={r} />
                  {showLabel && <text y={r + 12}>{n.title.length > 16 ? n.title.slice(0, 15) + '…' : n.title}</text>}
                </g>
              )
            })}
          </g>
        </svg>

        {hovered && (
          <div className="vgraph-tip" style={{ left: (hovered.x ?? 0) * view.k + view.x + 12, top: (hovered.y ?? 0) * view.k + view.y - 8 }}>
            <strong>{hovered.title}</strong>
            <span>{KIND_NAME[hovered.kind] ?? hovered.kind} · {hovered.category}</span>
          </div>
        )}
        {visible.nodes.length === 0 && <p className="vgraph-empty">연결된 노트가 없습니다.</p>}
      </div>

      {mode === 'global' && (
        <ul className="vgraph-legend" aria-label="노드 색 범례">
          {['project', 'log', 'activity', 'tag', 'page'].map((k) => (
            <li key={k} className={`k-${k}`}><i />{KIND_NAME[k]}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Graph
