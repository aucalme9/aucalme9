// ============================================================================
//  plexusAudio — Web Audio API 로 코드에서 즉석 합성하는 신스 사운드.
//  ※ mp3/wav 파일 없음. Oscillator/Gain/BiquadFilter/Delay/Compressor 노드만 사용.
//  기본 상태 muted. 첫 제스처에서 resume().
//
//  구성:
//   · 보이스   = 디튠된 오실레이터 2개 → 로우패스(플럭 엔벨로프) → 앰프 엔벨로프
//   · FX 버스  = 피드백 딜레이(공간감) + 마스터 컴프레서 + 하이패스(머디 제거)
//   · depth(점의 앞뒤) → 스케일 음(메이저 펜타토닉) 양자화 + 음량. 여러 점 = 화음.
// ============================================================================

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]   // 메이저 펜타토닉 확장 (항상 협화)
const ROOT = 146.83                                  // D3 — 따뜻한 저역
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)

function freqForDepth(z, octave = 0) {
  const idx = Math.round(clamp01(z) * (SCALE.length - 1))
  return ROOT * Math.pow(2, (SCALE[idx] + octave * 12) / 12)
}

export function createAudio() {
  let ctx = null
  let master = null      // 최종 게인 (mute 제어)
  let bus = null         // 보이스가 물리는 입력 (comp 앞)
  let sendGain = null    // 딜레이 send
  let lastMove = 0
  let enabled = false
  let muted = true
  let rotor = null       // 회전 효과음 지속 보이스 { o1, o2, filt, amp, lfo, lfoGain }

  function ensure() {
    if (ctx) return true
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    try {
      ctx = new AC()

      master = ctx.createGain()
      master.gain.value = muted ? 0 : 0.9
      master.connect(ctx.destination)

      // 마스터 다이내믹스 + 머디 제거
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -20; comp.knee.value = 22; comp.ratio.value = 3.2
      comp.attack.value = 0.004; comp.release.value = 0.22
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'; hp.frequency.value = 90
      comp.connect(hp); hp.connect(master)

      bus = ctx.createGain()
      bus.gain.value = 0.16
      bus.connect(comp)

      // 피드백 딜레이 (공간감)
      const delay = ctx.createDelay(1.0)
      delay.delayTime.value = 0.19
      const fb = ctx.createGain(); fb.gain.value = 0.32
      const dlp = ctx.createBiquadFilter()
      dlp.type = 'lowpass'; dlp.frequency.value = 2000
      const wet = ctx.createGain(); wet.gain.value = 0.5
      delay.connect(dlp); dlp.connect(fb); fb.connect(delay)
      dlp.connect(wet); wet.connect(comp)
      sendGain = ctx.createGain(); sendGain.gain.value = 0.28
      sendGain.connect(delay)

      return true
    } catch {
      ctx = null
      return false
    }
  }

  function resume() {
    if (!ensure()) return
    enabled = true
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  }
  function setMuted(m) {
    muted = m
    if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.04)
  }
  function isMuted() { return muted }

  // ── 신스 보이스 (디튠 2오실 → 플럭 로우패스 → 앰프 엔벨로프) ──
  function voice(freq, {
    type = 'sawtooth', dur = 0.6, peak = 0.09, when = 0,
    detune = 7, cutFrom = 4200, cutTo = 500, send = 1,
  } = {}) {
    if (!ctx || !enabled || muted) return
    const t = ctx.currentTime + when
    const o1 = ctx.createOscillator()
    const o2 = ctx.createOscillator()
    o1.type = type; o2.type = type
    o1.frequency.value = freq; o2.frequency.value = freq
    o1.detune.value = -detune; o2.detune.value = detune

    const mix = ctx.createGain(); mix.gain.value = 0.5
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.value = 6
    lp.frequency.setValueAtTime(cutFrom, t)
    lp.frequency.exponentialRampToValueAtTime(Math.max(80, cutTo), t + dur * 0.9)

    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0, t)
    amp.gain.linearRampToValueAtTime(peak, t + 0.008)
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    o1.connect(mix); o2.connect(mix); mix.connect(lp); lp.connect(amp)
    amp.connect(bus)
    if (send > 0) {
      const s = ctx.createGain(); s.gain.value = send
      amp.connect(s); s.connect(sendGain)
    }
    o1.start(t); o2.start(t)
    o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05)
  }

  // depth 배열 → 화음 (각 음 살짝 스태거 + depth 로 음정·음량)
  function chord(depths, opts = {}) {
    if (!ctx || !enabled || muted || !depths || !depths.length) return
    const spread = opts.spread ?? 0.02
    let k = 0
    const seen = new Set()
    for (const z of depths.slice(0, 4)) {
      const f = freqForDepth(z, opts.octave || 0)
      const key = Math.round(f)
      if (seen.has(key)) continue
      seen.add(key)
      voice(f, {
        type: opts.type || 'sawtooth',
        dur: opts.dur ?? 0.7,
        peak: (0.04 + 0.075 * clamp01(z)) * (opts.gain ?? 1),
        when: k * spread,
        cutFrom: opts.cutFrom ?? (2600 + 3200 * clamp01(z)),
        cutTo: opts.cutTo ?? 420,
        detune: opts.detune ?? 7,
      })
      k++
    }
  }

  // 마우스 이동: 아주 짧고 부드러운 필터드 블립 (커서 근처 점 depth 로 피치)
  function move(speed, z = 0.5) {
    if (!ctx || !enabled || muted) return
    const now = performance.now()
    if (now - lastMove < 85) return
    lastMove = now
    voice(freqForDepth(z, 1), {
      type: 'triangle', dur: 0.16,
      peak: (0.012 + speed * 0.02) * (0.5 + 0.5 * clamp01(z)),
      cutFrom: 1400 + speed * 2600, cutTo: 600, detune: 4, send: 0.5,
    })
  }

  // 좌클릭: 밝고 둥근 화음 (triangle, 넓게 열린 필터)
  function clickLeft(depths) {
    chord(depths && depths.length ? depths : [0.55], {
      type: 'triangle', dur: 0.8, spread: 0.018, cutFrom: 5200, cutTo: 700,
    })
  }
  // 우클릭: −1옥타브 sawtooth 화음 (어둡고 굵게) — 좌클릭과 음색·음역 구분
  function clickRight(depths) {
    chord(depths && depths.length ? depths : [0.4], {
      type: 'sawtooth', dur: 1.0, octave: -1, spread: 0.028, gain: 0.85,
      cutFrom: 1700, cutTo: 260, detune: 10,
    })
  }

  // 회전 효과음: 항상 살아있는 지속 보이스. 오브젝트의 각속도(intensity 0..1)에 따라
  //  음량·피치·필터·트레몰로 속도가 변함 → "객체가 돌면서 나는 소리". 매 프레임 호출.
  //  intensity ~0 이면 게인이 0 으로 수렴(무음). 명시적 정지는 dispose 에서만.
  function rotation(intensity) {
    if (!ctx || !enabled || muted) return
    const it = clamp01(intensity)
    if (!rotor) {
      const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator()
      o1.type = 'sawtooth'; o2.type = 'sawtooth'
      o1.detune.value = -11; o2.detune.value = 11
      const mix = ctx.createGain(); mix.gain.value = 0.5
      const filt = ctx.createBiquadFilter()
      filt.type = 'bandpass'; filt.Q.value = 2.5; filt.frequency.value = 320
      const amp = ctx.createGain(); amp.gain.value = 0
      // 트레몰로 (회전 도플러 느낌)
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 5
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0
      lfo.connect(lfoGain); lfoGain.connect(amp.gain)
      o1.connect(mix); o2.connect(mix); mix.connect(filt); filt.connect(amp)
      amp.connect(bus)
      const s = ctx.createGain(); s.gain.value = 0.35
      amp.connect(s); s.connect(sendGain)
      o1.start(); o2.start(); lfo.start()
      rotor = { o1, o2, filt, amp, lfo, lfoGain }
    }
    const t = ctx.currentTime
    const f = 46 + it * 240
    rotor.o1.frequency.setTargetAtTime(f, t, 0.12)
    rotor.o2.frequency.setTargetAtTime(f * 1.5, t, 0.12)
    rotor.filt.frequency.setTargetAtTime(240 + it * 1500, t, 0.12)
    rotor.amp.gain.setTargetAtTime(0.055 * it, t, 0.15)
    rotor.lfo.frequency.setTargetAtTime(3 + it * 9, t, 0.2)
    rotor.lfoGain.gain.setTargetAtTime(0.02 * it, t, 0.2)
  }

  function dispose() {
    try {
      if (rotor) { rotor.o1.stop(); rotor.o2.stop(); rotor.lfo.stop() }
    } catch { /* already stopped */ }
    rotor = null
    if (ctx) { ctx.close().catch(() => {}); ctx = null }
    master = bus = sendGain = null
    enabled = false
  }

  return { resume, setMuted, isMuted, move, clickLeft, clickRight, rotation, dispose }
}
