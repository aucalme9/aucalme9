// ═══════════════════════════════════════════════════════════════════════════
//  맵핑 미리보기 3D 엔진 (three.js) — 화면 UI 는 src/components/MappingStage.jsx
//
//  표면 3종 (mode 키)
//    'split' : 분할 디스플레이 — 무대 백월 LED 4×2 패널 + 좌우 세로 스크린
//    'dome'  : 반구(구)형 디스플레이 — 바깥 면 전체가 화면인 구조물
//    'walls' : 3면 벽 — 정면 + 좌·우 벽 프로젝션 룸
//
//  [크기조정] 각 구조물 치수는 아래 build* 함수의 상수(단위 m)를 바꾸면 됩니다.
//  [카메라]   모드별 시작 시점은 CAMERA_PRESETS (pos = 카메라 위치, target = 바라보는 점)
//  [색상변경] 바닥/구조물 색은 COLORS (사이트 tokens.css 와 같은 계열)
// ═══════════════════════════════════════════════════════════════════════════
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

const COLORS = {
  bg: 0x0a0a0b,
  floor: 0x0d0d10,
  grid: 0x29292f,
  gridStrong: 0x3c3c44,
  structure: 0x1a1a1e,
  frame: 0x131316,
  figure: 0x3c3c44,
  purple: 0x6e3aff,
}

export const CAMERA_PRESETS = {
  split: { pos: [0, 5.0, 18.5], target: [0, 2.8, 0] },
  dome: { pos: [18, 6.0, 21], target: [0, 5.6, 0] },
  walls: { pos: [0, 7.0, 15.5], target: [0, 1.8, -1.2] },
}

const TEX_ASPECT = 2 // 콘텐츠 기준 비율 (2:1). 다른 비율 영상도 늘어나서 채워짐.

// 펼친 화면(평면 배치도) 좌표를 텍스처 UV 로 변환.
//  배치도 전체 가로폭을 텍스처 가로에 맞추고, 세로는 비율대로 가운데 띠를 사용합니다.
function makeUVMapper(layoutW, layoutH) {
  const vSpan = Math.min(1, (layoutH / layoutW) * TEX_ASPECT)
  const v0 = (1 - vSpan) / 2
  return (x, y, w, h) => ({
    u0: x / layoutW,
    u1: (x + w) / layoutW,
    v0: v0 + (y / layoutH) * vSpan,
    v1: v0 + ((y + h) / layoutH) * vSpan,
  })
}

function setPlaneUV(geo, { u0, u1, v0, v1 }) {
  const uv = geo.attributes.uv
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0))
  }
  uv.needsUpdate = true
}

// 화면 1장 = 발광 화면 + 뒤쪽 프레임(어두운 박스)
function makeScreen(w, h, uvRect, screenMat, frameMat) {
  const g = new THREE.Group()
  const geo = new THREE.PlaneGeometry(w, h)
  setPlaneUV(geo, uvRect)
  const screen = new THREE.Mesh(geo, screenMat)
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.12), frameMat)
  frame.position.z = -0.07
  g.add(screen, frame)
  return g
}

// 스케일 참고용 사람 실루엣 (키 약 1.75m × scale)
function makeFigure(mat, scale = 1) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 1.4, 12), mat)
  body.position.y = 0.7
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat)
  head.position.y = 1.6
  g.add(body, head)
  g.scale.setScalar(scale)
  return g
}

// ── 1) 분할 디스플레이: 무대 + LED 백월(4×2) + 좌우 세로 스크린 ───────────
function buildSplit(mats) {
  const group = new THREE.Group()
  const STAGE_TOP = 1.0
  const PANEL_W = 2.6, PANEL_H = 1.6, COLS = 4, ROWS = 2, GAP = 0.08
  const SIDE_W = 1.8, SIDE_H = 3.2
  const mainW = COLS * PANEL_W
  const mainH = ROWS * PANEL_H
  const WALL_BOTTOM = STAGE_TOP + 0.6

  // 펼친 배치도: [좌 세로] 0.4 [메인 4×2] 0.4 [우 세로]
  const layoutW = SIDE_W + 0.4 + mainW + 0.4 + SIDE_W
  const toUV = makeUVMapper(layoutW, mainH)
  const regions = []

  // 무대
  const stage = new THREE.Mesh(new THREE.BoxGeometry(16, STAGE_TOP, 7), mats.structure)
  stage.position.set(0, STAGE_TOP / 2, 1)
  group.add(stage)

  // 메인 LED 패널
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const rect = toUV(SIDE_W + 0.4 + c * PANEL_W, r * PANEL_H, PANEL_W, PANEL_H)
      const p = makeScreen(PANEL_W - GAP, PANEL_H - GAP, rect, mats.screen, mats.frame)
      p.position.set(-mainW / 2 + PANEL_W * (c + 0.5), WALL_BOTTOM + PANEL_H * (r + 0.5), -1.6)
      group.add(p)
      regions.push({ label: `P${(ROWS - 1 - r) * COLS + c + 1}`, ...rect })
    }
  }

  // 좌우 세로 스크린 (관객 쪽으로 살짝 꺾음)
  ;[
    { label: 'L', x: 0, px: -7.5, rot: 0.38 },
    { label: 'R', x: layoutW - SIDE_W, px: 7.5, rot: -0.38 },
  ].forEach(({ label, x, px, rot }) => {
    const rect = toUV(x, 0, SIDE_W, SIDE_H)
    const s = makeScreen(SIDE_W, SIDE_H, rect, mats.screen, mats.frame)
    s.position.set(px, WALL_BOTTOM + SIDE_H / 2, -0.6)
    s.rotation.y = rot
    group.add(s)
    regions.push({ label, ...rect })
  })

  // 상부 트러스 + 기둥
  const truss = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.3, 0.3), mats.structure)
  truss.position.set(0, 6.0, -1.6)
  group.add(truss)
  ;[-9.05, 9.05].forEach((x) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.0, 0.3), mats.structure)
    col.position.set(x, 3.0, -1.6)
    group.add(col)
  })

  // 사람 (무대 위 1 + 관객)
  const performer = makeFigure(mats.figure)
  performer.position.set(-1.2, STAGE_TOP, 2.2)
  group.add(performer)
  ;[[-3.5, 7.5], [-1.2, 8.4], [1.4, 7.8], [3.6, 8.8], [0.2, 10]].forEach(([x, z]) => {
    const f = makeFigure(mats.figure)
    f.position.set(x, 0, z)
    group.add(f)
  })

  return { group, regions }
}

// ── 2) 반구(구)형 디스플레이: 지면 위에 놓인 대형 구체, 바깥 면 전체가 화면 ──
function buildDome(mats) {
  const group = new THREE.Group()
  const R = 6.5
  const THETA = Math.PI * 0.8 // 위에서부터 덮는 각도 (π = 완전한 구)
  const bottomY = R * Math.cos(THETA) // 음수
  const centerY = 1.2 - bottomY

  const geo = new THREE.SphereGeometry(R, 128, 72, 0, Math.PI * 2, 0, THETA)
  // 둘레 방향으로 콘텐츠 2회 반복 (구 둘레가 길어서 한 번이면 너무 늘어남)
  const uv = geo.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 2)
  uv.needsUpdate = true
  const sphere = new THREE.Mesh(geo, mats.screen)
  sphere.position.y = centerY
  group.add(sphere)

  // 받침대
  const ringR = R * Math.sin(THETA)
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(ringR, ringR + 0.9, 1.2, 64), mats.structure)
  plinth.position.y = 0.6
  group.add(plinth)

  // 주변 광장 사람 (작게 = 구조물이 크다는 스케일감)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3
    const d = 10 + (i % 3) * 1.6
    const f = makeFigure(mats.figure, 0.55)
    f.position.set(Math.cos(a) * d, 0, Math.sin(a) * d)
    group.add(f)
  }

  const regions = [
    { label: '0°–180°', u0: 0, u1: 0.5, v0: 0, v1: 1 },
    { label: '180°–360°', u0: 0.5, u1: 1, v0: 0, v1: 1 },
  ]
  return { group, regions }
}

// ── 3) 3면 벽: 정면 + 좌·우 벽이 이어지는 몰입형 프로젝션 룸 ──────────────
function buildWalls(mats) {
  const group = new THREE.Group()
  const W = 12, D = 9, H = 4.5
  const toUV = makeUVMapper(D + W + D, H)

  const left = toUV(0, 0, D, H)
  const front = toUV(D, 0, W, H)
  const right = toUV(D + W, 0, D, H)

  const lw = makeScreen(D, H, left, mats.screen, mats.frame)
  lw.position.set(-W / 2, H / 2, 0)
  lw.rotation.y = Math.PI / 2
  const fw = makeScreen(W, H, front, mats.screen, mats.frame)
  fw.position.set(0, H / 2, -D / 2)
  const rw = makeScreen(D, H, right, mats.screen, mats.frame)
  rw.position.set(W / 2, H / 2, 0)
  rw.rotation.y = -Math.PI / 2
  group.add(lw, fw, rw)

  // 상부 프로젝터 3대 — 정면용 1대(입구 쪽 트러스) + 좌·우 벽용 2대(가운데 트러스, 반대편 벽을 향해 교차 투사)
  const PJ_Y = H + 0.05
  const bars = [
    { w: 4, pos: [0, H + 0.3, D / 2 - 0.8] },
    { w: W - 1, pos: [0, H + 0.3, 0] },
  ]
  bars.forEach(({ w, pos }) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, 0.2), mats.structure)
    bar.position.set(...pos)
    group.add(bar)
  })
  const projectors = [
    { at: [0, PJ_Y, D / 2 - 0.8], wall: [[-W / 2, 0, -D / 2], [W / 2, 0, -D / 2], [W / 2, H, -D / 2], [-W / 2, H, -D / 2]] }, // 정면
    { at: [W / 2 - 1.5, PJ_Y, 0], wall: [[-W / 2, 0, D / 2], [-W / 2, 0, -D / 2], [-W / 2, H, -D / 2], [-W / 2, H, D / 2]] },  // 좌측 벽
    { at: [-W / 2 + 1.5, PJ_Y, 0], wall: [[W / 2, 0, -D / 2], [W / 2, 0, D / 2], [W / 2, H, D / 2], [W / 2, H, -D / 2]] },   // 우측 벽
  ]
  const beams = []
  projectors.forEach(({ at, wall }) => {
    const pj = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.5), mats.structure)
    pj.position.set(...at)
    pj.lookAt(new THREE.Vector3(...wall[0]).add(new THREE.Vector3(...wall[2])).multiplyScalar(0.5))
    group.add(pj)
    // 빔(빛줄기) — 렌즈에서 벽 네 모서리로 퍼지는 반투명 사각뿔
    const pts = [at, ...wall]
    const pos = new Float32Array(4 * 3 * 3)
    for (let k = 0; k < 4; k++) {
      ;[pts[0], pts[1 + k], pts[1 + ((k + 1) % 4)]].forEach((v, j) => pos.set(v, (k * 3 + j) * 3))
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const beam = new THREE.Mesh(geo, mats.beam)
    beam.renderOrder = 2
    group.add(beam)
    beams.push(beam)
  })

  // 관람객
  ;[[-1.5, 0.5], [1.2, 1.8], [0.2, -1], [2.8, -0.2]].forEach(([x, z]) => {
    const f = makeFigure(mats.figure)
    f.position.set(x, 0, z)
    group.add(f)
  })

  const regions = [
    { label: 'LEFT', ...left },
    { label: 'FRONT', ...front },
    { label: 'RIGHT', ...right },
  ]
  return { group, regions, beams }
}

const BUILDERS = { split: buildSplit, dome: buildDome, walls: buildWalls }

// ── 화면에서 주변으로 번지는 빛 (모드별 포인트 조명) ───────────────────────
//  [밝기조정] intensity 값. 화면 콘텐츠 색(보라)에 맞춘 은은한 반사광입니다.
const SPILL = {
  split: [{ pos: [0, 3.2, 1.2], intensity: 45, distance: 20 }],
  dome: [0, 1, 2, 3].map((k) => {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4
    return { pos: [Math.cos(a) * 8.5, 2.5, Math.sin(a) * 8.5], intensity: 28, distance: 16 }
  }),
  walls: [{ pos: [0, 2.2, -0.5], intensity: 30, distance: 14 }],
}

// ── DAY / NIGHT 환경값 ─────────────────────────────────────────────────
//  [색상변경] bg = 하늘/배경색, floor = 바닥, grid = 격자선
//  [밝기조정] ambient/hemi/sun = 자연광, spill = 화면 반사광 배율,
//             bloom = 화면이 빛나 보이는 정도(strength), screen = 화면 밝기 배율, beam = 프로젝터 빛줄기 진하기
const THEMES = {
  night: {
    bg: 0x0a0a0b, fogNear: 20, fogFar: 48,
    floor: 0x0d0d10, floorRough: 0.55, floorMetal: 0.35,
    grid: [0x3c3c44, 0x29292f], structure: 0x1a1a1e, figure: 0x3c3c44,
    ambient: 0.28, hemi: 0.12, sun: 0.25, sunColor: 0xb8c0ff, shadows: false,
    spill: 1, bloom: { strength: 0.85, radius: 0.55, threshold: 0.18 }, screen: 1.25, beam: 0.028, gridOpacity: 1,
  },
  day: {
    bg: 0xd4d6da, fogNear: 34, fogFar: 95,
    floor: 0xa3a5aa, floorRough: 0.92, floorMetal: 0,
    grid: [0x8a8c92, 0x989aa0], structure: 0x4a4b52, figure: 0x55565e,
    ambient: 0.75, hemi: 0.9, sun: 2.4, sunColor: 0xfff4e6, shadows: true,
    spill: 0.15, bloom: { strength: 0.18, radius: 0.4, threshold: 0.75 }, screen: 1.0, beam: 0.0, gridOpacity: 0.45,
  },
}

export function createMappingEngine({ container, source, initialMode = 'split', initialTime = 'night', reducedMotion = false }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(COLORS.bg)
  scene.fog = new THREE.Fog(COLORS.bg, 20, 48)

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200)

  // 자연광: 전체 밝기 + 하늘/땅 반사 + 해(낮) / 달빛(밤)
  const ambient = new THREE.AmbientLight(0xffffff, 0.3)
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8a90, 0.2)
  const sun = new THREE.DirectionalLight(0xffffff, 0.6)
  sun.position.set(14, 22, 12)
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 70 })
  sun.shadow.bias = -0.0005
  scene.add(ambient, hemi, sun)

  // 바닥 + 격자 (격자 색을 바꾸기 위해 재질 2개를 직접 지정)
  const floorMat = new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.6 })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)
  const grid = new THREE.GridHelper(80, 80, COLORS.gridStrong, COLORS.grid)
  grid.position.y = 0.002
  grid.material.vertexColors = false
  grid.material.transparent = true
  scene.add(grid)

  const applyTex = (tex) => {
    tex.wrapS = THREE.RepeatWrapping
    tex.needsUpdate = true
    return tex
  }
  const mats = {
    screen: new THREE.MeshBasicMaterial({ map: applyTex(source.texture), toneMapped: false }),
    frame: new THREE.MeshStandardMaterial({ color: COLORS.frame, roughness: 0.8 }),
    structure: new THREE.MeshStandardMaterial({ color: COLORS.structure, roughness: 0.85, metalness: 0.1 }),
    figure: new THREE.MeshStandardMaterial({ color: COLORS.figure, roughness: 0.9 }),
    // 프로젝터 빛줄기 — 더해지는(additive) 반투명 면
    beam: new THREE.MeshBasicMaterial({
      color: 0x9d7dff, transparent: true, opacity: 0.028, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    }),
  }
  source.onSwap = (tex) => {
    mats.screen.map = applyTex(tex)
    mats.screen.needsUpdate = true
  }

  const modes = {}
  const spills = []
  Object.entries(BUILDERS).forEach(([k, build]) => {
    modes[k] = build(mats)
    const g = modes[k].group
    g.traverse((o) => {
      if (o.isMesh && o.material !== mats.beam) { o.castShadow = true; o.receiveShadow = o.material !== mats.screen }
    })
    SPILL[k].forEach(({ pos, intensity, distance }) => {
      const l = new THREE.PointLight(COLORS.purple, intensity, distance, 2)
      l.position.set(...pos)
      l.userData.base = intensity
      g.add(l)
      spills.push(l)
    })
    g.visible = false
    scene.add(g)
  })

  // 후처리: 밝은 화면이 살짝 번져 빛나 보이게 (bloom)
  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(Math.min(dpr, 1.5))
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.8, 0.5, 0.2)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  // DAY / NIGHT 전환
  let time = null
  const setTime = (tm) => {
    const th = THEMES[tm]
    if (!th || tm === time) return
    time = tm
    scene.background.setHex(th.bg)
    scene.fog.color.setHex(th.bg)
    scene.fog.near = th.fogNear
    scene.fog.far = th.fogFar
    floorMat.color.setHex(th.floor)
    floorMat.roughness = th.floorRough
    floorMat.metalness = th.floorMetal
    grid.material.color.setHex(th.grid[0])
    grid.material.opacity = th.gridOpacity
    mats.structure.color.setHex(th.structure)
    mats.figure.color.setHex(th.figure)
    ambient.intensity = th.ambient
    hemi.intensity = th.hemi
    sun.intensity = th.sun
    sun.color.setHex(th.sunColor)
    sun.castShadow = th.shadows
    spills.forEach((l) => { l.intensity = l.userData.base * th.spill })
    Object.assign(bloom, { strength: th.bloom.strength, radius: th.bloom.radius, threshold: th.bloom.threshold })
    mats.screen.color.setScalar(th.screen)
    mats.beam.opacity = th.beam
    mats.beam.visible = th.beam > 0
  }
  setTime(initialTime)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  // 마우스 휠은 페이지 스크롤용으로 남겨둠 → 확대·축소는 화면의 + − 버튼으로
  controls.enableZoom = false
  // 모바일: 세로 스와이프는 페이지 스크롤, 가로 드래그만 회전
  renderer.domElement.style.touchAction = 'pan-y'
  controls.minDistance = 4
  controls.maxDistance = 34
  controls.maxPolarAngle = Math.PI * 0.49
  controls.autoRotateSpeed = 0.35
  controls.autoRotate = !reducedMotion
  controls.addEventListener('start', () => { controls.autoRotate = false; tween = null })

  // 카메라 이동 트윈 (모드 전환 / 시점 초기화)
  let tween = null
  const flyTo = (preset, instant = false) => {
    const toTgt = new THREE.Vector3(...preset.target)
    // 세로로 좁은 화면이면 조금 더 뒤에서 보기
    const far = camera.aspect < 1 ? 1.35 : 1
    const toPos = new THREE.Vector3(...preset.pos).sub(toTgt).multiplyScalar(far).add(toTgt)
    if (instant || reducedMotion) {
      camera.position.copy(toPos)
      controls.target.copy(toTgt)
      tween = null
      return
    }
    tween = {
      fromPos: camera.position.clone(),
      fromTgt: controls.target.clone(),
      toPos,
      toTgt,
      t0: performance.now(),
      dur: 900,
    }
  }

  let mode = null
  const setMode = (m, instant = false) => {
    if (!modes[m] || m === mode) return
    if (mode) modes[mode].group.visible = false
    modes[m].group.visible = true
    mode = m
    controls.autoRotate = !reducedMotion
    flyTo(CAMERA_PRESETS[m], instant)
  }

  const zoom = (factor) => {
    tween = null
    const offset = camera.position.clone().sub(controls.target)
    const len = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)
    camera.position.copy(controls.target).add(offset.setLength(len))
  }

  const resize = () => {
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    camera.aspect = w / h
    // 세로로 좁은 화면(모바일)에서는 화각을 넓혀 구조물이 잘리지 않게
    camera.fov = w / h < 1 ? 58 : 40
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  // 화면에 보일 때만 렌더 (스크롤 아래로 내려가면 정지)
  let visible = true
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
  io.observe(container)

  const clock = new THREE.Clock()
  let raf = 0
  const loop = () => {
    raf = requestAnimationFrame(loop)
    if (!visible || document.hidden) return
    const t = clock.getElapsedTime()
    source.update(reducedMotion ? t * 0.25 : t)
    if (tween) {
      const k = Math.min(1, (performance.now() - tween.t0) / tween.dur)
      const e = 1 - Math.pow(1 - k, 3)
      camera.position.lerpVectors(tween.fromPos, tween.toPos, e)
      controls.target.lerpVectors(tween.fromTgt, tween.toTgt, e)
      if (k >= 1) tween = null
    }
    controls.update()
    composer.render()
  }

  setMode(initialMode, true)
  loop()

  return {
    setMode,
    setTime,
    zoom,
    resetView: () => { controls.autoRotate = !reducedMotion; flyTo(CAMERA_PRESETS[mode]) },
    getRegions: (m) => modes[m]?.regions || [],
    dispose: () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
      })
      Object.values(mats).forEach((m) => m.dispose())
      floorMat.dispose()
      grid.material.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

// WebGL 사용 가능 여부 (불가하면 UI 에서 안내 박스로 대체)
export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
