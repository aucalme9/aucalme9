import { useEffect, useRef, useState } from 'react'
import { createAudio } from './plexusAudio'
import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import { projects } from '../data/projects'
import './PlexusField.css'

// PlexusField — Home 풀스크린. 별밤 + HUD 레이아웃 배경 위에 여러 겹의 구(球).
//  가운데 인터랙티브 구는 Nose–Hoover 어트랙터 경로. 최중심에는 빛나는 내심구(태양) + 랜덤 플레어.
//  움직이는 점·선(드리프터·마커·플레어)에만 글로우/블러. 페이크 3D(캔버스 2D), 라이브러리 없음.
//  · 호흡: 베지어 곡선처럼 자연스럽고 낮은 RPM (≈10)  · 클릭드래그 = 씬 회전 → 회전 효과음
//  · 마우스 이동 = 커서 근처(좁은 반경) 하이라이트  · 좌클릭 퍼짐 / 우클릭 모임 (약하게, ≈1/3)
//  · 마우스를 한 곳에 오래 두면 팝업 정보창: 배경=ABOUT/CONTACT, 구 근처=랜덤 프로젝트 소개
//  · prefers-reduced-motion / visibilitychange / cleanup 대응, getContext 실패 시 조용히 종료

function pickTier() {
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '') || window.innerWidth < 760
  if (mobile || cores <= 4 || mem <= 3) return { K: 5500, stars: 340, shellA: 220, shellB: 360, drifters: 7, mobile }
  if (cores <= 8 || mem <= 6) return { K: 10000, stars: 560, shellA: 320, shellB: 540, drifters: 12, mobile }
  return { K: 15000, stars: 900, shellA: 400, shellB: 720, drifters: 17, mobile }
}

function hexToRgb(hex, fallback) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex || '').trim())
  if (!m) return fallback
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

// 피보나치 구 — 단위 구면에 n개 점 (Float32Array x,y,z)
function fibSphere(n) {
  const a = new Float32Array(n * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const th = golden * i
    a[i * 3] = Math.cos(th) * r
    a[i * 3 + 1] = y
    a[i * 3 + 2] = Math.sin(th) * r
  }
  return a
}

export default function PlexusField() {
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [popup, setPopup] = useState(null)   // { x, y, ax, ay, kind, label, lines[] }
  const { lang } = useLanguage()
  const langRef = useRef(lang)
  langRef.current = lang

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return   // 극히 예외적 환경: 아무것도 렌더 않고 조용히 종료

    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const audio = createAudio()
    audioRef.current = audio

    const cssv = getComputedStyle(document.documentElement)
    const MONO = hexToRgb(cssv.getPropertyValue('--color-text-tertiary'), { r: 108, g: 108, b: 116 })
    const MONO_HI = hexToRgb(cssv.getPropertyValue('--color-text-primary'), { r: 237, g: 237, b: 240 })
    const PURP = hexToRgb(cssv.getPropertyValue('--color-purple-400'), { r: 138, g: 91, b: 255 })
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
    const rgMO = (a) => `rgba(${MONO.r},${MONO.g},${MONO.b},${a})`
    const rgHI = (a) => `rgba(${MONO_HI.r},${MONO_HI.g},${MONO_HI.b},${a})`
    const rgPU = (a) => `rgba(${PURP.r},${PURP.g},${PURP.b},${a})`

    const FOCAL = 3.4, CAM_Z = 2.6
    let w = 0, h = 0, cx = 0, cy = 0, span = 1
    let T = null
    let raf = 0

    let P = new Float32Array(0)                       // 어트랙터 (가운데 구)
    let disp, dv, lit, sxA, syA, nearA
    let shellA = new Float32Array(0), shellAEdges = new Int32Array(0), shellB = new Float32Array(0)
    let spikeDirs = new Float32Array(0)               // 내심구 스파이크 방향
    let stars = [], drifters = [], streaks = [], bokeh = []
    const markers = [], flares = []

    let rotX = 0.5, rotY = 0, rotZ = 0.12
    let avX = 0, avY = 0
    const IDLE_Y = reduced ? 0 : 0.0016
    const IDLE_X = reduced ? 0 : 0.0005
    let gauge = 0
    let flareT = 0

    const ptr = { x: -9999, y: -9999, inside: false, stillT: 0, dwellX: 0, dwellY: 0 }
    let down = false, dragging = false, downX = 0, downY = 0, lastX = 0, lastY = 0
    const ripples = []
    let last = performance.now()
    let popupShown = false, popupPX = 0, popupPY = 0

    // ── 빌더 ────────────────────────────────────────────────────────────
    function integrateAttractor(K) {
      const a = 1.5, dt = 0.014                       // Nose–Hoover:  x'=y  y'=-x+y*z  z'=a-y²
      let x = 0.1, y = 0.2, z = 0.1
      const step = () => {
        const nx = x + dt * y
        const ny = y + dt * (-x + y * z)
        const nz = z + dt * (a - y * y)
        x = nx; y = ny; z = nz
        if (!Number.isFinite(x)) { x = 0.1; y = 0.2; z = 0.1 }
      }
      for (let i = 0; i < 2000; i++) step()
      P = new Float32Array(K * 3)
      let mx = 0, my = 0, mz = 0
      for (let i = 0; i < K; i++) {
        step()
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z
        mx += x; my += y; mz += z
      }
      mx /= K; my /= K; mz /= K
      const radii = new Float32Array(K)
      for (let i = 0; i < K; i++) {
        P[i * 3] -= mx; P[i * 3 + 1] -= my; P[i * 3 + 2] -= mz
        radii[i] = Math.hypot(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])
      }
      radii.sort()
      const inv = 1 / (radii[Math.floor(K * 0.9)] || radii[K - 1] || 1)
      for (let i = 0; i < P.length; i++) P[i] = P[i] * inv + (Math.random() - 0.5) * 0.006
    }

    function buildShellA(n) {
      shellA = fibSphere(n)
      const maxLen2 = (3.4 / Math.sqrt(n)) ** 2
      const edges = [], seen = new Set()
      for (let i = 0; i < n; i++) {
        const ax = shellA[i * 3], ay = shellA[i * 3 + 1], az = shellA[i * 3 + 2]
        let n1 = -1, n2 = -1, n3 = -1, d1 = 9, d2 = 9, d3 = 9
        for (let j = 0; j < n; j++) {
          if (j === i) continue
          const dx = shellA[j * 3] - ax, dy = shellA[j * 3 + 1] - ay, dz = shellA[j * 3 + 2] - az
          const d = dx * dx + dy * dy + dz * dz
          if (d < d1) { d3 = d2; n3 = n2; d2 = d1; n2 = n1; d1 = d; n1 = j }
          else if (d < d2) { d3 = d2; n3 = n2; d2 = d; n2 = j }
          else if (d < d3) { d3 = d; n3 = j }
        }
        for (const [j, d] of [[n1, d1], [n2, d2], [n3, d3]]) {
          if (j < 0 || d > maxLen2) continue
          const key = i < j ? i * n + j : j * n + i
          if (seen.has(key)) continue
          seen.add(key); edges.push(i, j)
        }
      }
      shellAEdges = Int32Array.from(edges)
    }

    function buildBackground() {
      stars = Array.from({ length: T.stars }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.5 + Math.random() * 1.3, a: 0.12 + Math.random() * 0.5,
        tw: Math.random() * 6.28, ts: 0.3 + Math.random() * 1.1,
      }))
      // 대각 스트리크 (레퍼런스의 긁힘/광선)
      streaks = Array.from({ length: T.mobile ? 8 : 14 }, () => {
        const ang = -0.42 + (Math.random() - 0.5) * 0.12
        return {
          x: Math.random() * w * 1.4 - w * 0.2, y: Math.random() * h * 1.3 - h * 0.15,
          len: (0.3 + Math.random() * 0.9) * Math.hypot(w, h),
          a: 0.05 + Math.random() * 0.09, dx: Math.cos(ang), dy: Math.sin(ang),
          v: (Math.random() - 0.5) * 0.05,
        }
      })
      // 배경 보케 원
      bokeh = Array.from({ length: T.mobile ? 4 : 8 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 40 + Math.random() * 180, a: 0.03 + Math.random() * 0.05,
        vx: (Math.random() - 0.5) * 0.06, vy: (Math.random() - 0.5) * 0.06,
      }))
      // 배경 드리프터 (자유 이동 점 + 웨이) — 어트랙터 경로와 무관
      drifters = Array.from({ length: T.drifters }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
        trail: [],
      }))
    }

    function build() {
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, rect.width); h = Math.max(1, rect.height)
      cx = w / 2; cy = h / 2
      span = Math.min(w, h) * 0.42
      const dpr = Math.min(window.devicePixelRatio || 1, /Mobi|Android/i.test(navigator.userAgent) ? 1.3 : 1.75)
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const next = pickTier()
      if (!T || next.K !== T.K) {
        T = next
        integrateAttractor(T.K)
        disp = new Float32Array(T.K); dv = new Float32Array(T.K); lit = new Float32Array(T.K)
        sxA = new Float32Array(T.K); syA = new Float32Array(T.K); nearA = new Float32Array(T.K)
        buildShellA(T.shellA)
        shellB = fibSphere(T.shellB)
        spikeDirs = fibSphere(T.mobile ? 30 : 46)
        markers.length = 0
        for (let i = 0; i < 3; i++) markers.push({ mi: (T.K / 3) * i, speed: 5 + i * 2.5, trail: [] })
      } else {
        T = next
      }
      buildBackground()
    }

    const pp = [0, 0, 0]
    function proj(x, y, z, sy, cyr, sx, cxr, sz, cz, sc) {
      const x1 = x * cyr + z * sy
      let z1 = z * cyr - x * sy
      const y1 = y * cxr - z1 * sx
      z1 = y * sx + z1 * cxr
      const x2 = x1 * cz - y1 * sz
      const y2 = x1 * sz + y1 * cz
      const persp = FOCAL / (FOCAL + z1 + CAM_Z)
      pp[0] = cx + x2 * persp * span * sc
      pp[1] = cy + y2 * persp * span * sc
      pp[2] = z1
      return pp
    }

    // 클릭 반응: 주변 점을 반경 방향으로 퍼지게(L)/모이게(R). 모션 정도 약함(≈1/3).
    function burst(mx, my, kind) {
      const R = Math.min(w, h) * 0.2, R2 = R * R
      const sign = kind === 'R' ? -1 : 1
      const hits = []
      for (let i = 0; i < T.K; i++) {
        const dx = sxA[i] - mx, dy = syA[i] - my
        const d2 = dx * dx + dy * dy
        if (d2 < R2) {
          const f = 1 - Math.sqrt(d2) / R
          dv[i] += sign * f * f * (reduced ? 0.12 : 0.36)
          lit[i] = Math.min(1, lit[i] + f * 0.7)
          hits.push({ d2, z: nearA[i] })
        }
      }
      ripples.push({ x: mx, y: my, born: performance.now(), kind })
      if (ripples.length > 5) ripples.shift()
      hits.sort((p, q) => p.d2 - q.d2)
      return hits.slice(0, 4).map((it) => it.z)
    }

    // 마우스 드웰 → 정보 팝업 (배경: ABOUT/CONTACT / 구 근처: 랜덤 프로젝트)
    function openPopup(px, py) {
      const L = langRef.current
      const nearSphere = Math.hypot(px - cx, py - cy) < span * 1.35
      let kind, label, lines
      if (nearSphere) {
        const p = projects[(Math.random() * projects.length) | 0]
        kind = 'project'
        label = `PROJECT ${p.index}`
        lines = [
          p.title[L],
          (strings.filters[p.category] || strings.filters.other)[L] + ' · ' + p.year,
          p.subtitle[L],
        ]
      } else if (Math.random() < 0.5) {
        kind = 'about'
        label = strings.about.label[L]
        lines = [strings.about.profileLabel[L], strings.about.body[L]]
      } else {
        kind = 'contact'
        label = strings.contact.label[L]
        lines = [strings.contact.body[L], strings.contact.email]
      }
      const flip = px > w - 300
      const up = py > h - 170
      popupPX = px; popupPY = py
      setPopup({ x: px, y: py, ax: px + (flip ? -20 : 20), ay: py + (up ? -150 : -12), flip, kind, label, lines })
      popupShown = true
    }
    function closePopup() {
      if (popupShown) { popupShown = false; setPopup(null) }
    }

    // ── 프레임 ────────────────────────────────────────────────────────
    const NB = 4
    const buckets = Array.from({ length: 2 * NB }, () => [])
    const starB = [[], [], [], []]

    function frame(now) {
      const dt = Math.min(2.5, (now - last) / 16.67)
      last = now

      // 호흡: 사인 → smootherstep (베지어 느낌), 주기 ≈6s (RPM 약간 상향)
      let br = 0.5 - 0.5 * Math.cos((now / 6000) * Math.PI * 2)
      br = br * br * br * (br * (br * 6 - 15) + 10)
      const pulse = reduced ? 1 : 1 + (br - 0.5) * 0.05
      const sunPulse = reduced ? 1 : 1 + (br - 0.5) * 0.12 + Math.sin(now * 0.02) * 0.02

      avX *= 0.94; avY *= 0.94
      rotY += (IDLE_Y + avY) * dt
      rotX += (IDLE_X + avX) * dt + (reduced ? 0 : Math.sin(now * 0.00019) * 0.0012 * dt)
      gauge += 0.0006 * dt
      const angSpeed = Math.abs(avX) + Math.abs(avY) + (reduced ? 0 : 0.0013)
      audio.rotation(Math.min(1, angSpeed / 0.05))

      // 드웰 판정
      if (ptr.inside && !down && now - ptr.stillT > 900 && !popupShown) openPopup(ptr.dwellX, ptr.dwellY)

      ctx.clearRect(0, 0, w, h)

      // ── 배경 레이아웃: 대각 스트리크 + 보케 (정적, 아주 옅게) ──
      ctx.lineWidth = 1
      for (const s of streaks) {
        s.x += s.v * dt
        ctx.strokeStyle = rgMO(s.a.toFixed(3))
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.dx * s.len, s.y + s.dy * s.len); ctx.stroke()
      }
      for (const b of bokeh) {
        b.x += b.vx * dt; b.y += b.vy * dt
        if (b.x < -b.r) b.x = w + b.r; if (b.x > w + b.r) b.x = -b.r
        if (b.y < -b.r) b.y = h + b.r; if (b.y > h + b.r) b.y = -b.r
        ctx.strokeStyle = rgMO(b.a.toFixed(3))
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke()
      }

      // ── 별밤 (알파 4버킷) ──
      for (const bk of starB) bk.length = 0
      const twt = now * 0.001
      for (const s of stars) {
        const a = s.a * (0.5 + 0.5 * Math.sin(twt * s.ts + s.tw))
        starB[a < 0.12 ? 0 : a < 0.24 ? 1 : a < 0.4 ? 2 : 3].push(s.x, s.y, s.r)
      }
      for (let bk = 0; bk < 4; bk++) {
        const arr = starB[bk]
        if (!arr.length) continue
        ctx.fillStyle = rgHI((0.1 + bk * 0.16).toFixed(3))
        for (let k = 0; k < arr.length; k += 3) {
          const rr = arr[k + 2]
          ctx.fillRect(arr[k] - rr / 2, arr[k + 1] - rr / 2, rr, rr)
        }
      }

      // ── 배경 드리프터: 자유 이동 점 + 웨이 (글로우 + 블러) ──
      ctx.save()
      ctx.shadowBlur = 8
      ctx.shadowColor = rgHI(0.55)
      for (const d of drifters) {
        d.vx += (Math.random() - 0.5) * 0.05 * dt
        d.vy += (Math.random() - 0.5) * 0.05 * dt
        const sp = Math.hypot(d.vx, d.vy)
        if (sp > 0.9) { d.vx *= 0.9 / sp; d.vy *= 0.9 / sp }
        d.x += d.vx * dt; d.y += d.vy * dt
        if (d.x < -20) d.x = w + 20; if (d.x > w + 20) d.x = -20
        if (d.y < -20) d.y = h + 20; if (d.y > h + 20) d.y = -20
        d.trail.push(d.x, d.y)
        if (d.trail.length > 40) { d.trail.splice(0, 2) }
        // 블러용 넓은 저알파 underlay
        ctx.strokeStyle = rgMO(0.06)
        ctx.lineWidth = 3.5
        ctx.beginPath()
        for (let k = 0; k < d.trail.length; k += 2) k === 0 ? ctx.moveTo(d.trail[0], d.trail[1]) : ctx.lineTo(d.trail[k], d.trail[k + 1])
        ctx.stroke()
        // 코어 라인
        ctx.strokeStyle = rgHI(0.22)
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.fillStyle = rgHI(0.8)
        ctx.fillRect(d.x - 1.2, d.y - 1.2, 2.4, 2.4)
      }
      ctx.restore()

      // ── 겉 레이어 B — 먼 점 구 ──
      {
        const ry = -rotY * 0.55 + 2, rx = rotX * 0.5 + 0.3
        const sy = Math.sin(ry), cyr = Math.cos(ry), sx = Math.sin(rx), cxr = Math.cos(rx)
        for (let i = 0; i < shellB.length; i += 3) {
          const p = proj(shellB[i] * pulse, shellB[i + 1] * pulse, shellB[i + 2] * pulse, sy, cyr, sx, cxr, 0, 1, 1.34)
          const near = clamp01(0.6 - p[2] * 0.42)
          ctx.fillStyle = rgMO((0.07 + near * near * 0.4).toFixed(3))
          ctx.fillRect(p[0] - 0.5, p[1] - 0.5, 1.2, 1.2)
        }
      }

      // ── 겉 레이어 A — 지오데식 와이어프레임 구 ──
      {
        const ry = rotY * 0.8 + 0.5, rx = rotX * 0.8
        const sy = Math.sin(ry), cyr = Math.cos(ry), sx = Math.sin(rx), cxr = Math.cos(rx)
        const sz = Math.sin(rotZ * 0.5), cz = Math.cos(rotZ * 0.5)
        const n = shellA.length / 3
        const px = new Float32Array(n), py = new Float32Array(n), pd = new Float32Array(n)
        for (let i = 0, j = 0; j < n; i += 3, j++) {
          const p = proj(shellA[i] * pulse, shellA[i + 1] * pulse, shellA[i + 2] * pulse, sy, cyr, sx, cxr, sz, cz, 1.12)
          px[j] = p[0]; py[j] = p[1]; pd[j] = clamp01(0.62 - p[2] * 0.4)
        }
        ctx.lineWidth = 0.8
        for (let e = 0; e < shellAEdges.length; e += 2) {
          const i0 = shellAEdges[e], i1 = shellAEdges[e + 1]
          ctx.strokeStyle = rgMO((0.1 + (pd[i0] + pd[i1]) * 0.25).toFixed(3))
          ctx.beginPath(); ctx.moveTo(px[i0], py[i0]); ctx.lineTo(px[i1], py[i1]); ctx.stroke()
        }
        for (let j = 0; j < n; j++) {
          ctx.fillStyle = rgHI((0.22 + pd[j] * 0.6).toFixed(3))
          ctx.fillRect(px[j] - 1, py[j] - 1, 2, 2)
        }
      }

      // ── HUD 게이지 링 (레퍼런스 레이아웃) ──
      const gr = span * 1.15
      ctx.strokeStyle = rgMO(0.14)
      ctx.lineWidth = 1
      ctx.setLineDash([2, 7])
      ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([])
      ctx.beginPath(); ctx.arc(cx, cy, gr * 1.16, 0, Math.PI * 2); ctx.stroke()
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 30) {
        const ang = a + gauge
        const long = (a % (Math.PI / 6)) < 0.01
        const r0 = gr, r1 = gr + (long ? 9 : 4)
        ctx.strokeStyle = rgMO(long ? 0.28 : 0.14)
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0)
        ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1)
        ctx.stroke()
      }

      // ── 최중심 내심구(태양) — 빛나는 코어 + 스파이크 ──
      {
        const R = span * (0.115 * sunPulse)
        const gR = R * 2.7
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, gR)
        g.addColorStop(0, rgHI(0.92))
        g.addColorStop(0.22, rgPU(0.42))
        g.addColorStop(0.55, rgPU(0.1))
        g.addColorStop(1, rgPU(0))
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(cx, cy, gR, 0, Math.PI * 2); ctx.fill()
        // 스파이크 (ferrofluid 느낌)
        const sy = Math.sin(rotY * 1.2), cyr = Math.cos(rotY * 1.2)
        const sx = Math.sin(rotX * 1.2), cxr = Math.cos(rotX * 1.2)
        ctx.save()
        ctx.shadowBlur = 6
        ctx.shadowColor = rgPU(0.7)
        ctx.strokeStyle = rgHI(0.5)
        ctx.lineWidth = 1
        for (let i = 0; i < spikeDirs.length; i += 3) {
          const ln = 0.09 + 0.06 * (0.5 + 0.5 * Math.sin(now * 0.004 + i)) * sunPulse
          const p0 = proj(spikeDirs[i] * 0.09, spikeDirs[i + 1] * 0.09, spikeDirs[i + 2] * 0.09, sy, cyr, sx, cxr, 0, 1, 1)
          const a0x = p0[0], a0y = p0[1]
          const p1 = proj(spikeDirs[i] * ln, spikeDirs[i + 1] * ln, spikeDirs[i + 2] * ln, sy, cyr, sx, cxr, 0, 1, 1)
          ctx.beginPath(); ctx.moveTo(a0x, a0y); ctx.lineTo(p1[0], p1[1]); ctx.stroke()
        }
        ctx.restore()
      }

      // ── 가운데 어트랙터 구 (인터랙티브) — Nose–Hoover 경로 ──
      const sy = Math.sin(rotY), cyr = Math.cos(rotY)
      const sx = Math.sin(rotX), cxr = Math.cos(rotX)
      const sz = Math.sin(rotZ), cz = Math.cos(rotZ)
      const litR2 = (Math.min(w, h) * 0.08) ** 2
      for (const b of buckets) b.length = 0
      for (let i = 0; i < T.K; i++) {
        let dvi = dv[i], di = disp[i]
        if (dvi !== 0 || di !== 0) {
          dvi += -di * 0.02; dvi *= 0.9; di += dvi
          if (Math.abs(di) < 1e-4 && Math.abs(dvi) < 1e-4) { di = 0; dvi = 0 }
          dv[i] = dvi; disp[i] = di
        }
        const m = (1 + di) * pulse
        const x = P[i * 3] * m, y = P[i * 3 + 1] * m, z = P[i * 3 + 2] * m
        const x1 = x * cyr + z * sy
        let z1 = z * cyr - x * sy
        const y1 = y * cxr - z1 * sx
        z1 = y * sx + z1 * cxr
        const x2 = x1 * cz - y1 * sz
        const y2 = x1 * sz + y1 * cz
        const persp = FOCAL / (FOCAL + z1 + CAM_Z)
        const scr = cx + x2 * persp * span, scr2 = cy + y2 * persp * span
        sxA[i] = scr; syA[i] = scr2
        const near = clamp01(0.62 - z1 * 0.42)
        nearA[i] = near
        if (ptr.inside) {
          const dx = scr - ptr.x, dy = scr2 - ptr.y
          if (dx * dx + dy * dy < litR2) lit[i] = Math.min(1, lit[i] + 0.08)
        }
        lit[i] *= reduced ? 0.9 : 0.94
        if (i > 0) {
          const nAvg = (near + nearA[i - 1]) * 0.5
          if (nAvg > 0.04) {
            const ab = Math.min(NB - 1, (nAvg * NB) | 0)
            const col = Math.max(lit[i], lit[i - 1]) > 0.12 ? NB : 0
            buckets[col + ab].push(sxA[i - 1], syA[i - 1], scr, scr2)
          }
        }
      }
      for (let c = 0; c < 2; c++) {
        const col = c === 0 ? MONO : PURP
        for (let ab = 0; ab < NB; ab++) {
          const seg = buckets[c * NB + ab]
          if (!seg.length) continue
          const a = (0.07 + 0.8 * (ab / (NB - 1))) * (c === 0 ? 1 : 1.1)
          ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${Math.min(1, a).toFixed(3)})`
          ctx.lineWidth = c === 1 ? 1.1 : (ab >= NB - 1 ? 0.9 : 0.6)
          ctx.beginPath()
          for (let s = 0; s < seg.length; s += 4) { ctx.moveTo(seg[s], seg[s + 1]); ctx.lineTo(seg[s + 2], seg[s + 3]) }
          ctx.stroke()
        }
      }
      for (let i = 0; i < T.K; i += 5) {
        const near = nearA[i], l = lit[i]
        if (l > 0.15) {
          const s = 1.5 + near * 1.8 + l * 1.6
          ctx.fillStyle = rgPU((0.4 + 0.5 * near).toFixed(3))
          ctx.fillRect(sxA[i] - s / 2, syA[i] - s / 2, s, s)
        } else {
          const s = 0.7 + near * 1.8
          ctx.fillStyle = rgHI((0.12 + near * near * 0.5).toFixed(3))
          ctx.fillRect(sxA[i] - s / 2, syA[i] - s / 2, s, s)
        }
      }

      // ── 경로 위를 도는 점 + 웨이 (글로우 + 블러) ──
      ctx.save()
      ctx.shadowBlur = 10
      ctx.shadowColor = rgPU(0.9)
      for (const m of markers) {
        m.mi = (m.mi + m.speed * dt) % T.K
        m.trail.push(m.mi | 0)
        if (m.trail.length > 46) m.trail.shift()
        ctx.strokeStyle = rgPU(0.1)                 // 블러 underlay
        ctx.lineWidth = 3.5
        ctx.beginPath()
        for (let ti = 0; ti < m.trail.length; ti++) {
          const idx = m.trail[ti]
          ti === 0 ? ctx.moveTo(sxA[idx], syA[idx]) : ctx.lineTo(sxA[idx], syA[idx])
        }
        ctx.stroke()
        ctx.strokeStyle = rgPU(0.42)                // 코어
        ctx.lineWidth = 1
        ctx.stroke()
        const hi = m.mi | 0
        ctx.fillStyle = rgHI(0.95)
        ctx.fillRect(sxA[hi] - 2, syA[hi] - 2, 4, 4)
      }
      ctx.restore()

      // ── 태양 플레어 (랜덤 방출, 글로우) ──
      flareT -= dt
      if (flareT <= 0 && flares.length < 4 && !reduced) {
        flareT = 40 + Math.random() * 90
        const a0 = Math.random() * Math.PI * 2
        flares.push({ a0, t: 0, dur: 34 + Math.random() * 30, reach: span * (0.22 + Math.random() * 0.4), spread: 0.3 + Math.random() * 0.5, side: Math.random() < 0.5 ? 1 : -1 })
      }
      ctx.save()
      ctx.shadowBlur = 12
      ctx.shadowColor = rgPU(0.9)
      ctx.lineWidth = 1.4
      for (let fi = flares.length - 1; fi >= 0; fi--) {
        const fl = flares[fi]
        fl.t += dt
        const prog = fl.t / fl.dur
        if (prog >= 1) { flares.splice(fi, 1); continue }
        const grow = prog < 0.4 ? prog / 0.4 : 1
        const fade = prog < 0.4 ? 1 : 1 - (prog - 0.4) / 0.6
        const rIn = span * 0.12
        const a1 = fl.a0 + fl.side * fl.spread
        const x0 = cx + Math.cos(fl.a0) * rIn, y0 = cy + Math.sin(fl.a0) * rIn
        const x1 = cx + Math.cos(a1) * rIn, y1 = cy + Math.sin(a1) * rIn
        const midA = fl.a0 + fl.side * fl.spread * 0.5
        const bx = cx + Math.cos(midA) * (rIn + fl.reach * grow)
        const by = cy + Math.sin(midA) * (rIn + fl.reach * grow)
        ctx.strokeStyle = rgPU((0.5 * fade).toFixed(3))
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(bx, by, x1, y1); ctx.stroke()
      }
      ctx.restore()

      // ── 리플 ──
      const nowT = performance.now()
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rp = ripples[r]
        const age = (nowT - rp.born) / (rp.kind === 'R' ? 540 : 470)
        if (age >= 1) { ripples.splice(r, 1); continue }
        ctx.strokeStyle = rgPU((0.45 * (1 - age)).toFixed(3))
        ctx.lineWidth = 1
        if (rp.kind === 'L') {
          ctx.setLineDash([]); ctx.beginPath(); ctx.arc(rp.x, rp.y, 6 + age * 120, 0, Math.PI * 2); ctx.stroke()
        } else {
          ctx.setLineDash([4, 5])
          for (let ring = 0; ring < 2; ring++) { ctx.beginPath(); ctx.arc(rp.x, rp.y, (1 - age) * (90 - ring * 26) + 5, 0, Math.PI * 2); ctx.stroke() }
          ctx.setLineDash([])
        }
      }

      // ── 팝업 지시선 ──
      if (popupShown) {
        ctx.strokeStyle = rgPU(0.5)
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(ptr.dwellX, ptr.dwellY, 3, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ptr.dwellX, ptr.dwellY); ctx.lineTo(ptr.dwellX + 18, ptr.dwellY - 12); ctx.stroke()
      }

      raf = requestAnimationFrame(frame)
    }

    // ── 이벤트 ────────────────────────────────────────────────────────
    const toLocal = (e) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    function onMove(e) {
      const p = toLocal(e)
      const moved = Math.abs(p.x - ptr.x) + Math.abs(p.y - ptr.y)
      ptr.x = p.x; ptr.y = p.y; ptr.inside = true
      if (moved > 2) {
        ptr.stillT = performance.now(); ptr.dwellX = p.x; ptr.dwellY = p.y
        if (popupShown && Math.hypot(p.x - popupPX, p.y - popupPY) > 90) closePopup()
      }
      if (down) {
        if (!dragging && Math.abs(p.x - downX) + Math.abs(p.y - downY) > 4) dragging = true
        if (dragging) { avY += -(p.x - lastX) * 0.0002; avX += (p.y - lastY) * 0.0002 }
      }
      lastX = p.x; lastY = p.y
      if (!down && !T?.mobile) {
        const sp = Math.min(1, (Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0)) / 40)
        audio.move(sp, 0.5)
      }
    }
    function onLeave() { ptr.inside = false; closePopup() }
    function onDown(e) {
      audio.resume()
      closePopup()
      if (e.button === 2) return
      const p = toLocal(e)
      down = true; dragging = false
      downX = lastX = p.x; downY = lastY = p.y
      ptr.x = p.x; ptr.y = p.y; ptr.inside = true
    }
    function onUp(e) {
      if (!down) return
      down = false
      const p = toLocal(e)
      if (!dragging) audio.clickLeft(burst(p.x, p.y, 'L'))
      dragging = false
    }
    function onContext(e) {
      e.preventDefault()
      audio.resume()
      const p = toLocal(e)
      audio.clickRight(burst(p.x, p.y, 'R'))
    }
    function onVis() {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0 }
      else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) }
    }

    build()
    window.addEventListener('resize', build)
    window.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('contextmenu', onContext)
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', build)
      window.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('contextmenu', onContext)
      document.removeEventListener('visibilitychange', onVis)
      audio.dispose()
      audioRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="plexus">
      <canvas ref={canvasRef} className="plexus__canvas" aria-hidden="true" />

      {popup && (
        <div
          className={'plexus__popup plexus__popup--' + popup.kind + (popup.flip ? ' is-flip' : '')}
          style={{ left: popup.ax, top: popup.ay }}
        >
          <span className="plexus__popup-label sys-label">{popup.label}</span>
          {popup.lines.map((ln, i) => (
            <p key={i} className={'plexus__popup-line' + (i === 0 ? ' is-title' : '')}>{ln}</p>
          ))}
        </div>
      )}

      <button
        type="button"
        className="plexus__sound sys-label"
        aria-pressed={!muted}
        onClick={() => {
          const next = !muted
          setMuted(next)
          audioRef.current?.setMuted(next)
          if (!next) audioRef.current?.resume()
        }}
      >
        <span className="plexus__sound-dot" data-on={!muted} />
        {muted ? 'SOUND OFF' : 'SOUND ON'}
      </button>
    </div>
  )
}
