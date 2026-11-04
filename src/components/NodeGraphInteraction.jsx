// 상세 페이지 04 SYSTEM ARCHITECTURE 와 05 PROCESS 사이에 들어가는 TouchDesigner 스타일 노드 그래프.
//  마우스로 노드를 드래그해 옮길 수 있는 장식용 인터랙션 요소입니다.
//  [레이아웃조정] 그래프 높이·격자·노드 박스 모양은 src/components/NodeGraphInteraction.css
import { useState, useRef, useCallback } from 'react'
import './NodeGraphInteraction.css'

// steps 를 주면 (projects.js 의 fields.structure) 그 단계들을 왼쪽→오른쪽으로 이어진 노드로 표시.
//  없으면 기본 3단: INPUT → (첫 번째 툴) → OUTPUT
function buildNodes(tools, steps) {
  if (steps && steps.length) {
    const gap = 200 // [위치조정] 노드 사이 가로 간격(px)
    return steps.map((label, i) => ({
      id: `s${i}`,
      label: label.toUpperCase(),
      type: i === 0 ? 'source' : i === steps.length - 1 ? 'output' : 'process',
      x: 40 + i * gap,
      y: i % 2 === 0 ? 90 : 40,
    }))
  }
  return [
    { id: 'input', label: 'INPUT', type: 'source', x: 40, y: 90 },
    { id: 'core', label: (tools[0] || 'PROCESS').toUpperCase(), type: 'process', x: 240, y: 40 },
    { id: 'output', label: 'OUTPUT', type: 'output', x: 440, y: 100 },
  ]
}

export default function NodeGraphInteraction({ tools = [], steps = null }) {
  const containerRef = useRef(null)
  // ── 노드 정의 ────────────────────────────────────────────────────────
  //  type 값(source/process/output)은 CSS 색상 클래스와 연결됨 → 임의 변경 금지
  //  [내용수정] 노드 이름·개수는 projects.js (tools 첫 항목 또는 fields.structure)
  //  [위치조정] 초기 좌표는 위 buildNodes 의 x, y
  const [nodes, setNodes] = useState(() => buildNodes(tools, steps))
  // [연결선 정의] 노드 순서대로 앞→뒤 연결
  const edges = nodes.slice(1).map((n, i) => ({ from: nodes[i].id, to: n.id }))
  // 처음 배치된 노드가 모두 들어가는 최소 폭(px) — 140 = 노드 폭, 40 = 오른쪽 여유
  const [fieldMinWidth] = useState(() => Math.max(...buildNodes(tools, steps).map((n) => n.x)) + 140 + 40)
  const dragRef = useRef(null)

  const onMouseMove = useCallback((e) => {
    if (!dragRef.current) return
    const bounds = containerRef.current.getBoundingClientRect()
    const { id, offsetX, offsetY } = dragRef.current
    // 드래그 가능한 범위를 그래프 안쪽으로 제한.
    // 140 = 노드 폭, 56 = 노드 높이(대략). NodeGraphInteraction.css 의 .node-graph__node 크기와 맞춰야 함.
    const x = Math.max(0, Math.min(bounds.width - 140, e.clientX - bounds.left - offsetX))
    const y = Math.max(0, Math.min(bounds.height - 56, e.clientY - bounds.top - offsetY))
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)))
  }, [])

  const onMouseUp = useCallback(() => {
    dragRef.current = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  const onNodeMouseDown = (e, id) => {
    const bounds = containerRef.current.getBoundingClientRect()
    const node = nodes.find((n) => n.id === id)
    dragRef.current = { id, offsetX: e.clientX - bounds.left - node.x, offsetY: e.clientY - bounds.top - node.y }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const getPort = (id, side) => {
    const n = nodes.find((n) => n.id === id)
    // 연결선이 붙는 지점. 140 = 노드 폭(오른쪽 포트), 28 = 노드 높이 절반(세로 중앙).
    return side === 'out' ? { x: n.x + 140, y: n.y + 28 } : { x: n.x, y: n.y + 28 }
  }

  return (
    <div className="node-graph">
      {/* [내용수정] 그래프 상단 라벨 텍스트 */}
      <div className="node-graph__label sys-label">SYSTEM / NETWORK VIEW</div>
      {/* [레이아웃조정] 그래프 표시 영역 높이·격자 무늬는 NodeGraphInteraction.css → .node-graph__field */}
      {/* 좁은 화면에서는 노드가 잘리지 않도록 가로 스크롤 (필드 최소 폭 = 노드 배치 폭) */}
      <div className="node-graph__scroll">
      <div className="node-graph__field" ref={containerRef} style={{ minWidth: fieldMinWidth }}>
        <svg className="node-graph__lines">
          {edges.map((edge, i) => {
            const from = getPort(edge.from, 'out')
            const to = getPort(edge.to, 'in')
            const midX = (from.x + to.x) / 2
            return (
              <path key={i} d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                stroke="var(--color-purple-500)" fill="none" strokeWidth="1.5" />
            )
          })}
        </svg>
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`node-graph__node node-graph__node--${node.type}`}
            style={{ left: node.x, top: node.y }}
            onMouseDown={(e) => onNodeMouseDown(e, node.id)}
          >
            <div className="node-graph__node-header sys-label">{node.label}</div>
            <div className="node-graph__port node-graph__port--in" />
            <div className="node-graph__port node-graph__port--out" />
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}