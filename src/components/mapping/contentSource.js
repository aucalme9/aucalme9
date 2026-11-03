// ═══════════════════════════════════════════════════════════════════════════
//  맵핑 미리보기에 씌울 '콘텐츠 소스' — 3D 표면 텍스처 + 픽셀맵 카드가 같이 씁니다.
//
//  [미디어첨부] projects.js → mapping.media 에 경로를 넣으면 그 파일을 씌웁니다.
//     - 영상: .mp4 / .webm  (자동재생·음소거·반복. 가로 2:1 비율 권장, 예: 3840×1920)
//     - 이미지: .jpg / .png / .webp
//     - 비워두면('') 아래 '제너레이티브 테스트 패턴'이 자동으로 재생됩니다.
//     ※ 유튜브 링크는 브라우저 보안 정책상 3D 표면에 씌울 수 없습니다 → 파일로 넣어주세요.
//  [색상변경] 테스트 패턴 색은 아래 PALETTE (사이트 tokens.css 의 보라 톤과 맞춤)
// ═══════════════════════════════════════════════════════════════════════════
import * as THREE from 'three'
import { asset } from '../../utils/asset'

const PALETTE = {
  bg: '#0a0a0b',
  line: '#29292f',
  purple: '#6e3aff',
  purpleLight: '#8a5bff',
  purpleDeep: '#3d1f8f',
  text: '#ededf0',
  dim: '#6c6c74',
}

// 테스트 패턴 캔버스 크기 (2:1 = 돔 equirect 기준 비율)
const W = 1024
const H = 512

function isVideo(path) {
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(path || '')
}

// 매 프레임 그리는 제너레이티브 테스트 패턴 — 그리드 + 흐르는 파형 + 스캔 바 + 번호
function drawPattern(ctx, t, label) {
  ctx.fillStyle = PALETTE.bg
  ctx.fillRect(0, 0, W, H)

  // 기준 격자 (맵핑 정렬용 테스트 그리드 느낌)
  ctx.strokeStyle = PALETTE.line
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= W; x += 32) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H) }
  for (let y = 0; y <= H; y += 32) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5) }
  ctx.stroke()

  // 세로 스캔 바 (좌→우로 이동)
  const barX = ((t * 120) % (W + 160)) - 160
  ctx.fillStyle = PALETTE.purpleDeep
  ctx.fillRect(barX, 0, 120, H)
  ctx.fillStyle = PALETTE.purple
  ctx.fillRect(barX + 120, 0, 4, H)

  // 흐르는 파형 다발
  for (let i = 0; i < 14; i++) {
    const k = i / 13
    ctx.strokeStyle = i % 4 === 0 ? PALETTE.purpleLight : PALETTE.purple
    ctx.globalAlpha = 0.35 + 0.65 * (1 - Math.abs(k - 0.5) * 2)
    ctx.lineWidth = i % 4 === 0 ? 2 : 1
    ctx.beginPath()
    for (let x = 0; x <= W; x += 8) {
      const y =
        H * 0.5 +
        Math.sin(x * 0.006 + t * 0.9 + k * 3.2) * (60 + k * 70) +
        Math.sin(x * 0.017 - t * 1.4 + k * 6) * 18
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // 점 매트릭스 (깜빡임)
  ctx.fillStyle = PALETTE.text
  for (let gx = 16; gx < W; gx += 64) {
    for (let gy = 16; gy < H; gy += 64) {
      const on = Math.sin(gx * 0.05 + gy * 0.08 + t * 2) > 0.6
      if (on) ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3)
    }
  }

  // 반복 라벨 — 세로 가운데 띠에 배치 (3면 벽·분할 화면은 텍스처의 가운데 띠만 사용하므로)
  //  가로로 4번 반복해 어느 표면에서 봐도 정렬 확인이 되도록
  for (let i = 0; i < 4; i++) {
    const x = (W / 4) * i + 24
    ctx.font = '500 40px "Space Grotesk", sans-serif'
    ctx.textBaseline = 'top'
    ctx.fillStyle = PALETTE.text
    ctx.fillText(label, x, H / 2 - 58)
    ctx.font = '400 13px "IBM Plex Mono", monospace'
    ctx.fillStyle = PALETTE.dim
    ctx.fillText(`CH.${String(i + 1).padStart(2, '0')} / TEST SIGNAL`, x, H / 2 - 10)
  }

  // 하단 타임코드
  ctx.font = '400 14px "IBM Plex Mono", monospace'
  ctx.fillStyle = PALETTE.purpleLight
  const sec = Math.floor(t) % 60
  const fr = Math.floor((t % 1) * 30)
  ctx.fillText(`TC 00:00:${String(sec).padStart(2, '0')}:${String(fr).padStart(2, '0')}`, 24, H / 2 + 52)
}

// 미디어 경로에 맞는 소스를 만들어 반환.
//   texture  : three.js 텍스처 (3D 표면용)
//   drawable : 2D 캔버스에 그릴 수 있는 원본 (픽셀맵 카드용)
//   update(t): 매 프레임 호출 (테스트 패턴일 때만 실제로 다시 그림)
export function createContentSource({ media = '', label = 'P.00' } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const source = {
    kind: 'pattern',
    texture: new THREE.CanvasTexture(canvas),
    drawable: canvas,
    ready: true,
    update: (t) => {
      if (source.kind !== 'pattern') return
      drawPattern(ctx, t, label)
      source.texture.needsUpdate = true
    },
    dispose: () => {},
  }
  source.texture.colorSpace = THREE.SRGBColorSpace
  drawPattern(ctx, 0, label)

  // 실제 미디어가 지정되면 로드 성공 시 교체. 실패하면 테스트 패턴 유지.
  const url = asset(media)
  if (url && isVideo(url)) {
    const video = document.createElement('video')
    Object.assign(video, { src: url, muted: true, loop: true, playsInline: true, crossOrigin: 'anonymous' })
    video.setAttribute('playsinline', '')
    video.addEventListener(
      'loadeddata',
      () => {
        const tex = new THREE.VideoTexture(video)
        tex.colorSpace = THREE.SRGBColorSpace
        source.onSwap?.(tex)
        source.texture.dispose()
        source.texture = tex
        source.drawable = video
        source.kind = 'video'
      },
      { once: true },
    )
    video.play().catch(() => {})
    source.dispose = () => { video.pause(); video.removeAttribute('src'); video.load() }
  } else if (url) {
    new THREE.TextureLoader().load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      source.onSwap?.(tex)
      source.texture.dispose()
      source.texture = tex
      source.drawable = tex.image
      source.kind = 'image'
    })
  }

  return source
}
