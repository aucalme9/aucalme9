import Hero from '../components/Hero'
import TerrainField from '../components/TerrainField'
import './Home.css'

// Home — 최상단 히어로 섹션 + 인터랙티브 제너레이티브 배경(와이어프레임 등고선 지형).
//  이전의 Featured Projects / About / Contact 섹션은 제거됨.
//  컨셉: 'technical artist' — 풀블리드 캔버스 위에 HUD 프레임과 히어로 텍스트.
export default function Home() {
  return (
    <div className="home">
      {/* 배경: 무한 스크롤 등고선 지형 + 우상단 노브 HUD (구조는 src/components/TerrainField.jsx) */}
      <TerrainField />

      {/* HUD 코너 프레임 (장식) */}
      <div className="home__frame" aria-hidden="true">
        <span className="home__corner home__corner--tl" />
        <span className="home__corner home__corner--tr" />
        <span className="home__corner home__corner--bl" />
        <span className="home__corner home__corner--br" />
      </div>

      {/* 최상단(유일한) 섹션: 히어로 — 캔버스 위에 겹침. 문구는 src/i18n/strings.js → hero.* */}
      <div className="home__hero">
        <Hero />
      </div>

      {/* 하단 상태 바 (장식) */}
      <div className="home__status sys-label" aria-hidden="true">
        <span>FIELD · SPARSE-NOISE / fBm</span>
        <span>SCROLL · ∞</span>
        <span>RENDER · MARCHING-SQUARES CONTOUR</span>
      </div>
    </div>
  )
}
