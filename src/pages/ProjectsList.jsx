import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import { projects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import { blockStyle } from '../utils/layout'
import './ProjectsList.css'

// 섹션(블럭) 레이아웃 — Projects  (항목별 설명은 src/utils/layout.js)
//  3D 오빗 네비게이터라 화면을 꽉 채움.
const BLOCKS = {
  list: { order: 1, minHeight: '100vh', padTop: 0, padBottom: 0, padLeft: 0, padRight: 0, maxWidth: 'none' },
}

// ── 크기·위치 노브 (0~100, 50 = 기본값) ─────────────────────────────────
//  숫자만 바꾸면 그 비율로 커지거나 작아짐 / 이동함. 50 이 지금 셋팅해둔 기본값.
const RING_SIZE  = 120   // 링(원)의 크기 = 반지름
const CARD_SIZE  = 110   // 카드 크기
const RING_POS_X = 50   // 링 좌우 위치 (50 = 화면 중앙)
const RING_POS_Y = 50   // 링 상하 위치 (50 = 화면 중앙)

// ── 카메라 무빙 ────────────────────────────────────────────────────────
const PERSPECTIVE = 1800  // 원근 거리(px). 클수록 광각(원근) 왜곡이 줄어 평평해 보임.
const DRAG_SPEED  = 0.22  // 클릭드래그 카메라 회전 속도(끈 거리 1px 당 deg).
const PAN_MAX     = 5     // 마우스 위치에 따른 카메라 시선 이동폭(deg).
const EASE        = 0.12  // 카메라 회전 감속(0~1). 작을수록 더 부드럽게 따라옴.
const RULER_PX_PER_DEG = 6 // 하단 룰러 눈금이 1도당 이동하는 px.

// ── 위 0~100 값 → 실제 수치 (여기는 건드릴 필요 없음) ──
const RADIUS = 430 * (RING_SIZE / 50)          // 기본(50) → 430px
const CARD_W = 280 * (CARD_SIZE / 50)          // 기본(50) → 280 x 360
const CARD_H = 360 * (CARD_SIZE / 50)
const RING_X = (RING_POS_X - 50) * 10          // px, 50=0
const RING_Y = (RING_POS_Y - 50) * 10
const STEP = 360 / projects.length             // 카드 사이 각도(6개 → 60°)
const REDUCED = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function OrbitCardImage({ src }) {
  // 카드 전체 커버 이미지. 없거나 깨지면 사선 패턴으로 대체 (다른 카드와 동일 규칙).
  const [err, setErr] = useState(false)
  if (!src || err) return <div className="orbit__card-img orbit__card-img--empty" aria-hidden="true" />
  return (
    <img
      className="orbit__card-img"
      src={src}
      alt=""
      loading="lazy"
      onError={() => setErr(true)}
    />
  )
}

export default function ProjectsList() {
  const { lang } = useLanguage()
  const navigate = useNavigate()

  const orbitRef = useRef(null)
  const worldRef = useRef(null)
  const rulerRef = useRef(null)
  const readoutRef = useRef(null)
  const cardRefs = useRef([])
  const headingTarget = useRef(0)             // 드래그로 정하는 목표 Y각
  const headingNow = useRef(0)                // 실제 표시 중인 Y각(이징 적용)
  const pan = useRef({ x: 0, y: 0 })          // 마우스 패럴럭스 오프셋(deg)
  const pointer = useRef({ x: -1, y: -1, inside: false }) // 화면 좌표 (호버 판정용)
  const dragging = useRef(false)              // 지금 드래그(마우스 누른 채 이동) 중인가
  const draggedFar = useRef(false)            // 이번 제스처에서 4px 넘게 움직였나 → 클릭 라우팅 취소
  const dragStart = useRef({ x: 0, heading: 0 })
  const overIdx = useRef(-1)                  // 포인터가 올라간 카드 index (-1 = 없음). 클릭 시 이 카드로 이동

  // rAF 루프 — 트랜스폼/표시상태를 매 프레임 DOM 에 직접 write (리렌더 없음).
  //  ※ 호버·클릭은 CSS 3D hit-test 를 안 믿고, 정면 카드의 화면상 사각형과
  //    포인터 좌표를 직접 비교해서 판정한다(큰 카드가 겹칠 때도 확실히 동작).
  useEffect(() => {
    let raf
    const ease = REDUCED ? 1 : EASE
    const tick = () => {
      headingNow.current += (headingTarget.current - headingNow.current) * ease
      const h = headingNow.current
      const px = REDUCED ? 0 : pan.current.x
      const py = REDUCED ? 0 : pan.current.y

      // 카드별 각도 → opacity / z-index + 각 카드의 정면 거리 저장
      const dists = []
      for (let i = 0; i < cardRefs.current.length; i++) {
        const a = (((i * STEP + h) % 360) + 360) % 360
        const d = Math.min(a, 360 - a)                          // 0 = 정면
        dists[i] = d
        const el = cardRefs.current[i]
        if (el) {
          el.style.opacity = String(Math.max(0, Math.min(1, 1 - (d - 50) / 55)))
          el.style.zIndex = String(Math.round(1000 - d))
        }
      }

      // 포인터가 어느 카드 위인지 — 보이는 카드들의 화면상 사각형을 직접 검사.
      //  (CSS 3D hit-test 안 씀. 겹치면 더 정면인 카드를 선택.)
      //  드래그 여부와 무관하게 매 프레임 갱신 → 클릭 핸들러가 최신값을 읽음.
      let hoverIdx = -1
      let hoverDist = Infinity
      if (pointer.current.inside) {
        for (let i = 0; i < cardRefs.current.length; i++) {
          if (dists[i] > 95) continue                           // 뒤쪽(안 보이는) 카드 스킵
          const el = cardRefs.current[i]
          if (!el) continue
          const r = el.getBoundingClientRect()
          if (pointer.current.x >= r.left && pointer.current.x <= r.right
            && pointer.current.y >= r.top && pointer.current.y <= r.bottom
            && dists[i] < hoverDist) {
            hoverDist = dists[i]
            hoverIdx = i
          }
        }
      }
      overIdx.current = hoverIdx

      // 시각 호버(확대·테두리): 실제 드래그(움직임 발생) 중에는 끔. 가만히 누른 클릭에선 유지.
      const showHover = hoverIdx >= 0 && !(dragging.current && draggedFar.current)
      for (let i = 0; i < cardRefs.current.length; i++) {
        cardRefs.current[i]?.classList.toggle('is-hover', i === hoverIdx && showHover)
      }
      orbitRef.current?.classList.toggle('orbit--over', showHover)

      if (worldRef.current) {
        worldRef.current.style.transform =
          `translate(${RING_X}px, ${RING_Y}px) rotateX(${-py}deg) rotateY(${h + px}deg)`
      }

      // 하단 룰러 — h 를 -180~180 로 감아 그레이 넘버 배열이 끊기지 않게
      if (rulerRef.current) {
        const hw = ((h % 360) + 360) % 360
        const hc = hw > 180 ? hw - 360 : hw
        rulerRef.current.style.transform = `translateX(${hc * RULER_PX_PER_DEG}px)`
      }

      // 정면(카메라 시선)에 온 카드 번호 → 중앙 컬러 숫자
      const idx = ((Math.round(-h / STEP) % projects.length) + projects.length) % projects.length
      const num = projects[idx].index
      if (readoutRef.current && readoutRef.current.textContent !== num) {
        readoutRef.current.textContent = num
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // 마우스 위치 → 패럴럭스(deg) + 화면 좌표(호버 판정)
  const trackPointer = (e, r) => {
    pan.current = {
      x: ((e.clientX - r.left) / r.width - 0.5) * PAN_MAX * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * PAN_MAX * 2,
    }
    pointer.current = { x: e.clientX, y: e.clientY, inside: true }
  }
  const onStageMove = (e) => trackPointer(e, e.currentTarget.getBoundingClientRect())
  const onStageLeave = () => {
    pan.current = { x: 0, y: 0 }
    pointer.current.inside = false
  }

  // 클릭드래그 회전 — NodeGraphInteraction.jsx 패턴
  const onDragMove = useCallback((e) => {
    const dx = e.clientX - dragStart.current.x
    if (Math.abs(dx) > 4) draggedFar.current = true
    // 드래그 방향과 링이 도는 방향 일치: 오른쪽으로 끌면 카드도 오른쪽으로 흐름
    headingTarget.current = dragStart.current.heading - dx * DRAG_SPEED
    pointer.current = { x: e.clientX, y: e.clientY, inside: true }
  }, [])

  const onDragUp = useCallback(() => {
    dragging.current = false
    // 가장 가까운 카드가 정면에 딱 오도록 스냅 (호버·클릭이 정확히 걸리게)
    headingTarget.current = Math.round(headingTarget.current / STEP) * STEP
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragUp)
  }, [onDragMove])

  const onStageDown = (e) => {
    // 혹시 이전 제스처의 리스너가 남아있으면 먼저 제거(창 밖에서 버튼 놓은 경우 등)
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragUp)
    dragging.current = true
    draggedFar.current = false
    dragStart.current = { x: e.clientX, heading: headingTarget.current }
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragUp)
  }

  // 클릭: 이번 제스처가 드래그가 아니었고 포인터가 어떤 카드 위였으면 그 프로젝트로 이동
  const onStageClick = () => {
    if (draggedFar.current) return
    const p = projects[overIdx.current]
    if (p) navigate(`/projects/${p.slug}`)
  }

  return (
    <div className="page-blocks">
      <section className="projects-list" style={blockStyle(BLOCKS.list)}>
        {/* ── 3D 오빗 스테이지 (포인터 있는 환경) ── */}
        <div
          className="orbit"
          ref={orbitRef}
          style={{
            perspective: `${PERSPECTIVE}px`,
            '--card-w': `${CARD_W}px`,   // 카드 크기 (CARD_SIZE 에서 계산)
            '--card-h': `${CARD_H}px`,
          }}
          onMouseDown={onStageDown}
          onMouseMove={onStageMove}
          onMouseLeave={onStageLeave}
          onClick={onStageClick}
        >
          <div className="orbit__world" ref={worldRef}>
            <div className="orbit__grid orbit__grid--floor" />
            <div className="orbit__grid orbit__grid--ceil" />

            {/* [내용수정] 카드 텍스트(번호·제목·부제)와 이미지는 src/data/projects.js 에서 수정
                  index / title / subtitle / cover.
                [카드 크기]  상단 CARD_SIZE(0~100) / [글자·텍스트 레이어]  ProjectsList.css 의 .orbit__card-*
                (카드는 pointer-events:none — 클릭·호버는 위 rAF 루프가 좌표로 판정. 키보드 Tab/Enter 는 그대로 동작) */}
            {projects.map((p, i) => (
              <Link
                key={p.id}
                ref={(el) => { cardRefs.current[i] = el }}
                to={`/projects/${p.slug}`}
                className="orbit__card"
                style={{ '--card-t': `rotateY(${i * STEP}deg) translateZ(${-RADIUS}px)` }}
                aria-label={p.title[lang] || `Project ${p.index}`}
              >
                <OrbitCardImage src={p.cover} />
                <div className="orbit__card-body">
                  <span className="orbit__card-index sys-label">P.{p.index}</span>
                  <span className="orbit__card-title">{p.title[lang]}</span>
                  <span className="orbit__card-sub">{p.subtitle[lang]}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* 하단 각도 룰러 — 카메라 시선 각도에 배치된 프로젝트 넘버 표시 */}
          <div className="orbit__ruler" aria-hidden="true">
            <div className="orbit__ruler-ticks" ref={rulerRef}>
              {[-1, 0, 1].flatMap((rep) =>
                projects.map((p, i) => (
                  <span
                    key={`${rep}-${p.id}`}
                    className="orbit__ruler-num sys-label"
                    style={{ left: `${(rep * 360 + i * STEP) * RULER_PX_PER_DEG}px` }}
                  >
                    {p.index}
                  </span>
                ))
              )}
            </div>
            <span className="orbit__ruler-readout" ref={readoutRef}>{projects[0].index}</span>
          </div>

          <span className="orbit__hint sys-label">CLICK · DRAG TO LOOK AROUND</span>
        </div>

        {/* ── 폴백: 포인터 없음/좁은 화면 → 기존 카드 그리드 ── */}
        <div className="projects-list__fallback container">
          <h1 className="sys-label projects-list__label">{strings.nav.projects[lang]}</h1>
          <div className="projects-list__grid">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
