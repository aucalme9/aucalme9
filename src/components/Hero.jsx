import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import './Hero.css'

// [내용수정] 히어로 우측 상단에서 한 줄씩 교체되며 흐르는 시스템 로그 텍스트.
//   항목을 추가/삭제하면 순환 목록이 늘거나 줄어듭니다. (애니메이션 속도는 Hero.css 의 sys-cycle)
const SYSTEM_TOOLS = ['TOUCHDESIGNER', 'BLENDER', 'GENERATIVE_WORKFLOW', 'REALTIME_VISUAL']

// style 은 Home 의 BLOCKS.hero (순서·상하 높이·안쪽 여백)에서 전달됩니다.
export default function Hero({ style }) {
  const { lang } = useLanguage()
  const titleLines = strings.hero.title[lang].split('\n')

  return (
    // [상하여백·높이·순서] src/pages/Home.jsx 의 BLOCKS.hero 에서 조절
    <section className="hero" style={style}>
      <div className="container hero__inner">
        {/* 상단 메타 줄: 직함 라벨 + 구분선 + 흐르는 로그 */}
        <div className="hero__meta sys-label">
          {/* [내용수정] 직함 텍스트는 strings.js → hero.eyebrow */}
          <span>{strings.hero.eyebrow[lang]}</span>
          <span className="hero__meta-divider" />{/* [레이아웃조정] 세로 구분선 크기: Hero.css .hero__meta-divider */}
          <span className="hero__system-log" aria-hidden="true">
            {SYSTEM_TOOLS.map((tool, i) => (
              <span key={tool} style={{ animationDelay: `${i * 3}s` }}>
                {tool}
              </span>
            ))}
          </span>
        </div>

        {/* 메인 타이틀. [내용수정] 문구·줄바꿈(\n)은 strings.js → hero.title
            [레이아웃조정] 글자 크기(--fs-hero)·줄폭(max-width)은 Hero.css → .hero__title */}
        <h1 className="hero__title">
          {titleLines.map((line, i) => (
            <span key={i} className="hero__title-line">
              {line}
            </span>
          ))}
        </h1>

        {/* [내용수정] 설명 문단은 strings.js → hero.description
            [레이아웃조정] 상단 간격·줄폭은 Hero.css → .hero__desc */}
        <p className="hero__desc">{strings.hero.description[lang]}</p>
      </div>
    </section>
  )
}
