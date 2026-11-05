// ═══════════════════════════════════════════════════════════════════════════
//  프로젝트 상세 상단 '맵핑 미리보기' — 3D 뷰어 + 하단 스펙 카드 4장
//   · 3D 구조물/카메라  : src/components/mapping/mappingEngine.js
//   · 씌우는 콘텐츠      : src/components/mapping/contentSource.js
//   · 프로젝트별 값      : src/data/projects.js → mapping (media / modes / specs)
//   · 라벨·설명 텍스트   : src/i18n/strings.js → mapping
//   · 레이아웃/색        : src/components/MappingStage.css
//  three.js 가 크기 때문에 ProjectDetail 에서 lazy 로 불러옵니다(첫 화면 로딩에 영향 없음).
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { strings } from '../i18n/strings'
import { createMappingEngine, hasWebGL } from './mapping/mappingEngine'
import { createContentSource } from './mapping/contentSource'
import './MappingStage.css'

const ALL_MODES = ['split', 'walls', 'dome'] // 기본 탭 순서: 분할 → 3면 벽 → 반구형
const PURPLE = '#8a5bff'

// 픽셀맵 카드 — 콘텐츠 원본 위에 '어느 영역이 어느 화면으로 가는지' 구획을 겹쳐 표시
function PixelMap({ source, regions }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !source) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)

    const draw = () => {
      raf = requestAnimationFrame(draw)
      if (!visible || document.hidden) return
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = Math.max(1, Math.round(rect.width * dpr))
      const H = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }

      ctx.fillStyle = '#0a0a0b'
      ctx.fillRect(0, 0, W, H)
      try { ctx.drawImage(source.drawable, 0, 0, W, H) } catch { /* 아직 로딩 중 */ }

      // 사용되지 않는 영역은 어둡게
      ctx.fillStyle = 'rgba(10,10,11,0.72)'
      const used = regions.reduce(
        (a, r) => ({ v0: Math.min(a.v0, r.v0), v1: Math.max(a.v1, r.v1) }),
        { v0: 1, v1: 0 },
      )
      if (regions.length) {
        ctx.fillRect(0, 0, W, (1 - used.v1) * H)
        ctx.fillRect(0, (1 - used.v0) * H, W, used.v0 * H)
      }

      // 구획선 + 라벨 (UV 의 v 는 아래가 0 → 캔버스 y 는 뒤집어서)
      ctx.strokeStyle = PURPLE
      ctx.lineWidth = Math.max(1, dpr)
      ctx.font = `${10 * dpr}px "IBM Plex Mono", monospace`
      ctx.textBaseline = 'top'
      regions.forEach((r) => {
        const x = r.u0 * W
        const y = (1 - r.v1) * H
        const w = (r.u1 - r.u0) * W
        const h = (r.v1 - r.v0) * H
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
        const tw = ctx.measureText(r.label).width
        ctx.fillStyle = '#0a0a0b'
        ctx.fillRect(x + 1, y + 1, tw + 6 * dpr, 14 * dpr)
        ctx.fillStyle = '#ededf0'
        ctx.fillText(r.label, x + 4 * dpr, y + 3 * dpr)
      })
    }
    draw()
    return () => { cancelAnimationFrame(raf); io.disconnect() }
  }, [source, regions])

  return <canvas ref={canvasRef} className="mapping-card__pixelmap" aria-hidden="true" />
}

export default function MappingStage({ project, lang }) {
  const t = strings.mapping
  const cfg = project.mapping || {}
  const modes = (cfg.modes || ALL_MODES).filter((m) => ALL_MODES.includes(m))
  const [mode, setMode] = useState(modes[0] || 'split')
  // [기본값] 처음 들어왔을 때 환경: 'night'(어두운 실내/밤) 또는 'day'(낮)
  const [time, setTime] = useState('night')
  const [regions, setRegions] = useState([])
  const [source, setSource] = useState(null)
  const [webgl] = useState(() => hasWebGL())
  const viewportRef = useRef(null)
  const engineRef = useRef(null)

  // 엔진 생성/정리 — 프로젝트(media)가 바뀔 때만 다시 만듦
  useEffect(() => {
    if (!webgl || !viewportRef.current) return
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const src = createContentSource({ media: cfg.media, label: `P.${project.index}` })
    const engine = createMappingEngine({
      container: viewportRef.current,
      source: src,
      initialMode: modes[0] || 'split',
      initialTime: time,
      reducedMotion,
    })
    engineRef.current = engine
    setSource(src)
    setMode(modes[0] || 'split')
    setRegions(engine.getRegions(modes[0] || 'split'))
    return () => {
      engine.dispose()
      src.dispose()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webgl, project.slug, cfg.media])

  const selectMode = (m) => {
    setMode(m)
    engineRef.current?.setMode(m)
    setRegions(engineRef.current?.getRegions(m) || [])
  }

  const toggleTime = () => {
    const next = time === 'night' ? 'day' : 'night'
    setTime(next)
    engineRef.current?.setTime(next)
  }

  const info = t.modes[mode]
  const spec = cfg.specs?.[mode] || {}
  const sourceLabel = cfg.media ? t.sourceMedia : t.sourceTest

  return (
    <section className="mapping" aria-label={t.label[lang]}>
      {/* ── 3D 뷰어 ─────────────────────────────────────────────────── */}
      <div className="mapping__stage">
        <div className="mapping__viewport" ref={viewportRef}>
          {!webgl && <div className="mapping__fallback sys-label">{t.noWebgl[lang]}</div>}
        </div>

        {/* 좌상단 라벨 */}
        <div className="mapping__tag sys-label">
          <span className="mapping__tag-key">{t.label[lang]}</span>
          <span>P.{project.index} · {info.name[lang]} · {t[time][lang]}</span>
        </div>

        {/* 상단 가운데 — 표면 전환 탭 [내용수정] 탭 이름은 strings.js mapping.modes.*.tab */}
        {modes.length > 1 && (
          <div className="mapping__tabs" role="tablist" aria-label={t.label[lang]}>
            {modes.map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                className={`mapping__tab sys-label${mode === m ? ' is-active' : ''}`}
                onClick={() => selectMode(m)}
              >
                {t.modes[m].tab[lang]}
              </button>
            ))}
          </div>
        )}

        {/* 우측 — 확대 / 축소 / 시점 초기화 */}
        {webgl && (
          <div className="mapping__zoom">
            <button className="mapping__btn" onClick={() => engineRef.current?.zoom(0.8)} aria-label={t.zoomIn[lang]}>+</button>
            <button className="mapping__btn" onClick={() => engineRef.current?.zoom(1.25)} aria-label={t.zoomOut[lang]}>−</button>
            <button className="mapping__btn mapping__btn--reset" onClick={() => engineRef.current?.resetView()} aria-label={t.reset[lang]}>⟲</button>
            {/* DAY / NIGHT 전환 — 버튼에는 '지금 환경'을 표시 */}
            <button
              className={`mapping__btn mapping__btn--time sys-label is-${time}`}
              onClick={toggleTime}
              aria-label={time === 'night' ? t.toDay[lang] : t.toNight[lang]}
              aria-pressed={time === 'day'}
            >
              <span aria-hidden="true">{time === 'night' ? '☾' : '☀'}</span>
              <span>{t[time][lang]}</span>
            </button>
          </div>
        )}

        {/* 좌하단 — 조작 안내 / 소스 표시 */}
        <div className="mapping__hint sys-label">
          <span>{t.hint[lang]}</span>
          <span className="mapping__hint-src">{sourceLabel[lang]}</span>
        </div>
      </div>

      {/* ── 하단 카드 4장 (SURFACE / RESOLUTION / OUTPUT / PIXEL MAP) ── */}
      <div className="mapping__cards">
        <article className="mapping-card">
          <header className="mapping-card__head sys-label">
            <span>{t.cards.surface[lang]}</span>
            <span className="mapping-card__idx">01</span>
          </header>
          <p className="mapping-card__title">{info.name[lang]}</p>
          <p className="mapping-card__desc">{info.desc[lang]}</p>
          <ul className="mapping-card__rows sys-label">
            {info.facts.map((f) => (
              <li key={f.k}><span>{f.k}</span><span>{f.v}</span></li>
            ))}
          </ul>
        </article>

        <article className="mapping-card">
          <header className="mapping-card__head sys-label">
            <span>{t.cards.resolution[lang]}</span>
            <span className="mapping-card__idx">02</span>
          </header>
          <p className="mapping-card__value">{spec.resolution || '—'}</p>
          <ul className="mapping-card__rows sys-label">
            <li><span>{t.cards.pitch[lang]}</span><span>{spec.pitch || '—'}</span></li>
            <li><span>{t.cards.fps[lang]}</span><span>{spec.fps || '—'}</span></li>
          </ul>
          {/* 표면 개수만큼 막대 — 출력이 몇 개의 면으로 나뉘는지 한눈에 */}
          <div className="mapping-card__bars" aria-hidden="true">
            {regions.map((r) => (
              <span key={r.label} style={{ flexGrow: Math.max(0.05, r.u1 - r.u0) }} />
            ))}
          </div>
        </article>

        <article className="mapping-card">
          <header className="mapping-card__head sys-label">
            <span>{t.cards.output[lang]}</span>
            <span className="mapping-card__idx">03</span>
          </header>
          <p className="mapping-card__value">
            {spec.outputs || '—'}
            <span className="mapping-card__unit sys-label">{t.cards.outputs[lang]}</span>
          </p>
          <div className="mapping-card__chain">
            <span className="sys-label mapping-card__chain-label">{t.cards.chain[lang]}</span>
            <p>{spec.chain || '—'}</p>
          </div>
        </article>

        <article className="mapping-card mapping-card--map">
          <header className="mapping-card__head sys-label">
            <span>{t.cards.pixelMap[lang]}</span>
            <span className="mapping-card__idx">04</span>
          </header>
          {webgl && source ? (
            <PixelMap source={source} regions={regions} />
          ) : (
            <div className="mapping-card__pixelmap mapping-card__pixelmap--empty" />
          )}
          <p className="sys-label mapping-card__foot">
            {regions.length} REGION{regions.length === 1 ? '' : 'S'} · 2:1 CANVAS
          </p>
        </article>
      </div>
    </section>
  )
}
