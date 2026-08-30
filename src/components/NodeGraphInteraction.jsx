// 상세 페이지 하단(BLOCKS.graph)에 들어가는 TouchDesigner 스타일 노드 그래프.
//  마우스로 노드를 드래그해 옮길 수 있는 장식용 인터랙션 요소입니다.
//  [레이아웃조정] 그래프 높이·격자·노드 박스 모양은 src/components/NodeGraphInteraction.css
import { useState, useRef, useCallback } from 'react'
import './NodeGraphInteraction.css'

export default function NodeGraphInteraction({ tools = [] }) {
  const containerRef = useRef(null)
  // ── 노드 정의 ────────────────────────────────────────────────────────
  //  [내용수정] label = 박스에 표시되는 글자 (core 는 프로젝트 첫 번째 tool 을 자동 사용)
  //  [위치조정] x, y = 그래프 안에서의 초기 좌표(px). 값을 바꾸면 시작 배치가 달라짐
  //  [노드 추가/삭제] 줄을 추가·삭제하고, 아래 edges 의 연결도 함께 맞추면 됨
  //  type 값(source/process/output)은 CSS 색상 클래스와 연결됨 → 임의 변경 금지
  const [nodes, setNodes] = useState([
    { id: 'input', label: 'INPUT', type: 'source', x: 40, y: 90 },
    { id: 'core', label: (tools[0] || 'PROCESS').toUpperCase(), type: 'process', x: 240, y: 40 },
    { id: 'output', label: 'OUTPUT', type: 'output', x: 440, y: 100 },
  ])
  // [연결선 정의] from → to 는 위 노드의 id. 노드를 추가했다면 여기에 연결도 추가.
  const edges = [{ from: 'input', to: 'core' }, { from: 'core', to: 'output' }]
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
      <div className="node-graph__field" ref={containerRef}>
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
  )
}