import { useEffect, useRef, useState } from 'react'
import './TerrainField.css'

// ═══════════════════════════════════════════════════════════════════════════
//  TerrainField — 인터랙티브 제너레이티브 배경.
//  실제 z(고도) 값을 가진 3D 등고선 지형을 오블리크 카메라로 렌더(마칭스퀘어 iso-line).
//  지형은 좌상중단 → 우하중단 방향으로 무한 스크롤. 산맥(능선)을 유연하게 오가며
//  카메라와 함께 전진하는 빛나는 웨이포인트 + 길게 늘어지는 키네틱 궤적.
//  우상단 패널: 슬라이더1 = 등고선 복잡도(노이즈 주파수) / 슬라이더2 = 높이 구간당 선 개수 / RESET.
//  의존성 없음(Canvas 2D + 인라인 fBm 노이즈).
//  성능: DPR 상한, 격자 축소, 마칭 셀별 min/max, 밴드당 stroke 1회, shadowBlur 최소.
//        버벅이면 GX/GZ 또는 lines 슬라이더를 낮추면 됨.
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULTS = { freq: 1.0, lines: 28 }
const FREQ_MIN = 0.35
const FREQ_MAX = 3.0
const LINES_MIN = 12
const LINES_MAX = 44

// 격자 해상도 — 등고선 해상도 2배(좁은 원의 프레임 스파이크 방지).
//  버벅이면 이 두 값을 낮추면 됨 (예: 168 / 128).
const GX = 240
const GZ = 176

// 월드 크기 / 노이즈 스팬 / 고도 — 화면에 더 타이트하게 맞춰 화면 밖 셀 낭비를 줄임
const WORLD_W = 4.15
const Z_NEAR = -0.7
const Z_FAR = 4.55
const WD = Z_FAR - Z_NEAR
const HEIGHT = 2.5
const NX_SPAN = 3.7
const NZ_SPAN = 4.7
const H_OFF = 0.22          // 고도 기준선(이 값이 화면상 '평지')

// 스크롤: 안쪽(+z) + 오른쪽(+x) → 화면상 좌상 → 우하
const SPEED = 0.0072
const X_RATIO = 0.4

// 오블리크 카메라 (돔형 시점)
const CAM_Y = 2.5
const CAM_Z = -0.8
const CAM_PITCH = -0.98
const FOCAL = 1.12

// ── 인라인 노이즈: 정수 해시 → 값노이즈(퀸틱 보간) → 3옥타브 fBm ──
function hash(ix, iy) {
  let h = (ix * 374761393 + iy * 668265263) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10) }
function valueNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const a = hash(ix, iy), b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  const u = fade(fx), v = fade(fy)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x, y) {
  // 2 옥타브 — 격자 해상도를 2배로 올린 대신 옥타브를 줄여 비용 상쇄.
  //  잔물결(3옥타브)이 빠지면서 좁은 원의 우글거림도 감소.
  return 0.62 * valueNoise(x, y) + 0.38 * valueNoise(x * 2.03, y * 2.03)
}

// ── 가로 슬라이더 ──
function Slider({ label, value, min, max, display, onChange }) {
  const norm = (value - min) / (max - min)
  const trackRef = useRef(null)
  const setFromX = (clientX) => {
    const r = trackRef.current.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
    onChange(min + p * (max - min))
  }
  return (
    <div className="tslider">
      <div className="tslider__row sys-label">
        <span className="tslider__label">{label}</span>
        <span className="tslider__value">{display}</span>
      </div>
      <div
        ref={trackRef}
        className="tslider__track"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.round(value * 100) / 100}
        onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* 캡처 미지원/합성 이벤트 */ } setFromX(e.clientX) }}
        onPointerMove={(e) => { if (e.buttons & 1) setFromX(e.clientX) }}
        onKeyDown={(e) => {
          const step = (max - min) / 40
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(max, value + step)) }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(min, value - step)) }
        }}
      >
        <span className="tslider__fill" style={{ width: `${norm * 100}%` }} />
        <span className="tslider__thumb" style={{ left: `${norm * 100}%` }} />
      </div>
    </div>
  )
}

export default function TerrainField() {
  const canvasRef = useRef(null)
  const [freq, setFreq] = useState(DEFAULTS.freq)
  const [lines, setLines] = useState(DEFAULTS.lines)

  const params = useRef({ freq, lines })
  useEffect(() => { params.current = { freq, lines } }, [freq, lines])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const N = GX * GZ
    const SXA = new Float32Array(N)
    const SYA = new Float32Array(N)
    const HA = new Float32Array(N)
    const OKA = new Uint8Array(N)
    const seg = [[], []]          // seg[band] = flat [x1,y1,x2,y2,...] (모든 레벨 합침 → stroke 1회/밴드)

    let w = 0, h = 0, raf = 0, t = 0
    let scrollZ = 0, scrollX = 0
    let vignette = null

    const cp = Math.cos(CAM_PITCH)
    const sp = Math.sin(CAM_PITCH)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25)   // 배경이므로 상한 낮게
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      vignette = ctx.createRadialGradient(w * 0.5, h * 0.48, h * 0.42, w * 0.5, h * 0.48, h * 1.05)
      vignette.addColorStop(0, 'rgba(10, 10, 11, 0)')
      vignette.addColorStop(1, 'rgba(10, 10, 11, 0.6)')
    }
    resize()
    window.addEventListener('resize', resize)

    // raw ≈ 0~1, 고도는 raw² 로 봉우리 강조 (Math.pow 제거 → 저렴)
    const raw = (nx, nz, fq) => fbm(nx * fq + 13, nz * fq + 7)
    const heightAt = (nx, nz, fq) => { const r = raw(nx, nz, fq); return r * r }

    let PSX = 0, PSY = 0, POK = 0
    const project = (wx, wy, wz) => {
      const dy = wy - CAM_Y
      const dz = wz - CAM_Z
      const rz = dy * sp + dz * cp
      if (rz < 0.06) { POK = 0; return }
      const ry = dy * cp - dz * sp
      const f = FOCAL * Math.min(w, h)
      PSX = w * 0.5 + (wx * f) / rz
      PSY = h * 0.44 - (ry * f) / rz
      POK = 1
    }
    const nProject = (nx, nz, fq) => {
      project(
        ((nx + scrollX) / NX_SPAN) * WORLD_W,
        (heightAt(nx, nz, fq) - H_OFF) * HEIGHT,
        Z_NEAR + ((nz - scrollZ) / NZ_SPAN) * WD,
      )
    }

    // ── 웨이포인트: 산맥(능선)을 유연하게 오가며 카메라와 함께 전진 ──
    //  등고선 고정 없음. gradient 로 능선 접선 방향 흐름 + 목표 고도로 완만히 당김 +
    //  카메라 따라가기, 속도를 강하게 스무딩 → 부드러운 곡선 플로우.
    const RIDGE_H = 0.62       // 이 raw 고도 근처(능선)를 선호
    const FLOW = SPEED * 1.15  // 능선 접선 속도
    const CLIMB = 0.020        // 목표 고도로 당기는 게인
    const SMOOTH = 0.05        // 속도 스무딩(작을수록 유연)
    const wps = [
      { nx: 0.35, nz: NZ_SPAN * 0.5, vx: SPEED * X_RATIO, vz: SPEED, trail: [], init: false },
      { nx: -0.55, nz: NZ_SPAN * 0.52, vx: SPEED * X_RATIO, vz: SPEED, trail: [], init: false },
    ]
    const stepWp = (wp, fq) => {
      if (!wp.init) { wp.nz += scrollZ; wp.init = true }
      const e = 0.03
      const c = raw(wp.nx, wp.nz, fq)
      const gx = (raw(wp.nx + e, wp.nz, fq) - raw(wp.nx - e, wp.nz, fq)) / (2 * e)
      const gz = (raw(wp.nx, wp.nz + e, fq) - raw(wp.nx, wp.nz - e, fq)) / (2 * e)
      const gl = Math.hypot(gx, gz) || 1e-4
      // 능선 접선(gradient 수직) — 현재 진행방향에 가까운 쪽 선택 → 급반전 방지
      let ax = -gz / gl, az = gx / gl
      if (ax * wp.vx + az * wp.vz < 0) { ax = -ax; az = -az }
      // 목표 고도로 완만히 오르내림
      const dh = RIDGE_H - c
      // 좌우 화면 밖으로 새지 않게 부드러운 복원
      const nxRel = wp.nx + scrollX
      const bx = nxRel > NX_SPAN * 0.34 ? -SPEED * 0.9 : nxRel < -NX_SPAN * 0.34 ? SPEED * 0.9 : 0
      const tx = ax * FLOW + (gx / gl) * dh * CLIMB + SPEED * X_RATIO + bx
      const tz = az * FLOW + (gz / gl) * dh * CLIMB + SPEED
      wp.vx += (tx - wp.vx) * SMOOTH
      wp.vz += (tz - wp.vz) * SMOOTH
      wp.nx += wp.vx
      wp.nz += wp.vz
      wp.trail.push(wp.nx, wp.nz)
      if (wp.trail.length > 460) wp.trail.splice(0, wp.trail.length - 460)
    }

    const dots = []
    for (let i = 0; i < 90; i++) {
      dots.push({ nx: (Math.random() - 0.5) * NX_SPAN, nz: scrollZ + Math.random() * NZ_SPAN })
    }

    const draw = (animate) => {
      const fq = params.current.freq
      // 주파수 적응형: FREQ 1.0(기본) 이하는 풀 해상도(2배 격자·전체 레벨).
      //  FREQ 를 올릴수록(작은 봉우리 다수) 격자·레벨을 낮춰 좁은 원의 프레임 드랍 방지.
      //  노이즈 자체가 디테일을 제한하므로 시각차는 미미.
      const q = Math.max(1, (fq - 1) * 0.62 + 1)
      const gzE = Math.max(72, Math.round(GZ / q))
      const gxE = Math.max(96, Math.round(GX / q))
      const rawLines = Math.round(params.current.lines)
      const levels = fq > 1.2
        ? Math.max(9, Math.round(rawLines / (fq * 0.82)))
        : Math.max(6, rawLines)
      const L0 = 0.05, L1 = 0.8
      const dL = (L1 - L0) / (levels - 1)

      if (animate) {
        t += 1
        scrollZ += SPEED
        scrollX += SPEED * X_RATIO
        for (let i = 0; i < dots.length; i++) {
          if ((dots[i].nz - scrollZ) / NZ_SPAN < -0.06) {
            dots[i].nz = scrollZ + NZ_SPAN * (0.9 + Math.random() * 0.2)
            dots[i].nx = (Math.random() - 0.5) * NX_SPAN
          }
        }
        stepWp(wps[0], fq)
        if (t % 2 === 0) stepWp(wps[1], fq)
      }

      ctx.fillStyle = '#0a0a0b'
      ctx.fillRect(0, 0, w, h)

      // ── 필드 계산 + 투영 ──
      for (let j = 0; j < gzE; j++) {
        const v = j / (gzE - 1)
        const wz = Z_NEAR + v * WD
        const nz = v * NZ_SPAN + scrollZ
        const base = j * gxE
        for (let i = 0; i < gxE; i++) {
          const wx0 = (i / (gxE - 1) - 0.5) * WORLD_W
          const nx = (wx0 / WORLD_W) * NX_SPAN - scrollX
          const hgt = heightAt(nx, nz, fq)
          const idx = base + i
          HA[idx] = hgt
          project(wx0, (hgt - H_OFF) * HEIGHT, wz)
          if (POK) { SXA[idx] = PSX; SYA[idx] = PSY; OKA[idx] = 1 } else OKA[idx] = 0
        }
      }

      // ── 마칭스퀘어: 셀별 min/max 로 관련 레벨만, 밴드별 flat 버퍼에 적재 ──
      seg[0].length = 0
      seg[1].length = 0
      const jSplit = Math.floor(gzE * 0.46)
      for (let j = 0; j < gzE - 1; j++) {
        const s = j < jSplit ? seg[1] : seg[0]
        const rowA = j * gxE
        const rowB = rowA + gxE
        for (let i = 0; i < gxE - 1; i++) {
          const A = rowA + i, B = A + 1, C = rowB + i + 1, D = rowB + i
          if (!(OKA[A] & OKA[B] & OKA[C] & OKA[D])) continue
          const ha = HA[A], hb = HA[B], hc = HA[C], hd = HA[D]
          let mn = ha, mx = ha
          if (hb < mn) mn = hb; else if (hb > mx) mx = hb
          if (hc < mn) mn = hc; else if (hc > mx) mx = hc
          if (hd < mn) mn = hd; else if (hd > mx) mx = hd
          if (mx <= L0 || mn >= L1) continue
          const xa = SXA[A], ya = SYA[A], xb = SXA[B], yb = SYA[B]
          const xc = SXA[C], yc = SYA[C], xd = SXA[D], yd = SYA[D]
          // 화면 밖 셀 컬링 (넓은 FOV 근거리 행의 양끝은 화면 밖으로 크게 벗어남)
          let mnx = xa, mxx = xa, mny = ya, mxy = ya
          if (xb < mnx) mnx = xb; else if (xb > mxx) mxx = xb
          if (xc < mnx) mnx = xc; else if (xc > mxx) mxx = xc
          if (xd < mnx) mnx = xd; else if (xd > mxx) mxx = xd
          if (mxx < -48 || mnx > w + 48) continue
          if (yb < mny) mny = yb; else if (yb > mxy) mxy = yb
          if (yc < mny) mny = yc; else if (yc > mxy) mxy = yc
          if (yd < mny) mny = yd; else if (yd > mxy) mxy = yd
          if (mxy < -48 || mny > h + 48) continue
          let ls = Math.ceil((mn - L0) / dL)
          let le = Math.floor((mx - L0) / dL)
          if (ls < 0) ls = 0
          if (le > levels - 1) le = levels - 1
          for (let L = ls; L <= le; L++) {
            const lv = L0 + L * dL
            let code = 0
            if (ha > lv) code |= 1
            if (hb > lv) code |= 2
            if (hc > lv) code |= 4
            if (hd > lv) code |= 8
            if (code === 0 || code === 15) continue
            const tT = (lv - ha) / (hb - ha)
            const tR = (lv - hb) / (hc - hb)
            const tB = (lv - hd) / (hc - hd)
            const tL = (lv - ha) / (hd - ha)
            const xT = xa + (xb - xa) * tT, yT = ya + (yb - ya) * tT
            const xR = xb + (xc - xb) * tR, yR = yb + (yc - yb) * tR
            const xB = xd + (xc - xd) * tB, yB = yd + (yc - yd) * tB
            const xL = xa + (xd - xa) * tL, yL = ya + (yd - ya) * tL
            switch (code) {
              case 1: case 14: s.push(xL, yL, xT, yT); break
              case 2: case 13: s.push(xT, yT, xR, yR); break
              case 3: case 12: s.push(xL, yL, xR, yR); break
              case 4: case 11: s.push(xR, yR, xB, yB); break
              case 6: case 9: s.push(xT, yT, xB, yB); break
              case 7: case 8: s.push(xL, yL, xB, yB); break
              case 5: s.push(xL, yL, xT, yT, xR, yR, xB, yB); break
              case 10: s.push(xT, yT, xR, yR, xL, yL, xB, yB); break
              default: break
            }
          }
        }
      }

      // ── 등고선 그리기 (밴드당 stroke 1회) ──
      // 수만 개의 짧은 세그먼트: round join/cap 은 래스터 비용이 커서 butt/miter 로.
      ctx.lineJoin = 'miter'
      ctx.lineCap = 'butt'
      const styles = [{ a: 0.26, lw: 0.8 }, { a: 0.62, lw: 1.05 }]
      for (let b = 0; b < 2; b++) {
        const s = seg[b]
        if (!s.length) continue
        ctx.beginPath()
        for (let k = 0; k < s.length; k += 4) {
          ctx.moveTo(s[k], s[k + 1])
          ctx.lineTo(s[k + 2], s[k + 3])
        }
        ctx.strokeStyle = `rgba(232, 236, 244, ${styles[b].a})`
        ctx.lineWidth = styles[b].lw
        ctx.stroke()
      }

      // ── 흩어진 점 ──
      ctx.fillStyle = 'rgba(205, 208, 216, 0.2)'
      for (let i = 0; i < dots.length; i++) {
        nProject(dots[i].nx, dots[i].nz, fq)
        if (POK) ctx.fillRect(PSX, PSY, 1.4, 1.4)
      }

      // ── 웨이포인트 궤적 ──
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      for (let wi = 0; wi < wps.length; wi++) {
        const wp = wps[wi]
        if (wp.trail.length < 8) continue
        const pts = []
        for (let k = 0; k < wp.trail.length; k += 2) {
          nProject(wp.trail[k], wp.trail[k + 1], fq)
          if (POK) pts.push(PSX, PSY)
        }
        if (pts.length < 8) continue
        const tail = Math.max(0, pts.length - 150)
        const strokeFrom = (from, lw, col) => {
          ctx.beginPath()
          ctx.moveTo(pts[from], pts[from + 1])
          for (let k = from + 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1])
          ctx.strokeStyle = col
          ctx.lineWidth = lw
          ctx.stroke()
        }
        strokeFrom(tail, 11, 'rgba(150, 120, 255, 0.10)')   // 넓은 저알파 → 글로우/블러 느낌
        strokeFrom(tail, 5, 'rgba(200, 182, 255, 0.20)')
        strokeFrom(0, 1.3, 'rgba(226, 230, 240, 0.3)')      // 희미한 전체 꼬리
        strokeFrom(tail, 2.3, 'rgba(255, 255, 255, 0.96)')  // 밝은 코어

        const hx = pts[pts.length - 2], hy = pts[pts.length - 1]
        ctx.save()
        ctx.translate(hx, hy)
        ctx.rotate(Math.PI / 4)
        if (!reduced) { ctx.shadowBlur = 16; ctx.shadowColor = 'rgba(150, 110, 255, 0.95)' }
        ctx.fillStyle = '#dccfff'
        ctx.fillRect(-4, -4, 8, 8)
        ctx.restore()
      }

      // ── 비네트 (돔형) ──
      if (vignette) { ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h) }
    }

    const step = () => { draw(true); raf = requestAnimationFrame(step) }
    if (reduced) draw(false)
    else raf = requestAnimationFrame(step)

    const onVis = () => {
      if (reduced) return
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(step)
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="terrain" aria-hidden="true" />

      <div className="terrain-hud">
        <span className="terrain-hud__title sys-label">CONTOUR&nbsp;FIELD</span>
        <Slider label="FREQ" value={freq} min={FREQ_MIN} max={FREQ_MAX} display={freq.toFixed(2)} onChange={setFreq} />
        <Slider label="LINES" value={lines} min={LINES_MIN} max={LINES_MAX} display={String(Math.round(lines))} onChange={setLines} />
        <button
          type="button"
          className="terrain-hud__reset sys-label"
          onClick={() => { setFreq(DEFAULTS.freq); setLines(DEFAULTS.lines) }}
        >
          RESET
        </button>
      </div>
    </>
  )
}
