import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import { blockStyle } from '../utils/layout'
import './About.css'

// 섹션(블럭) 레이아웃 설정 — About  (항목별 설명은 src/utils/layout.js 참고)
//  6블록 구조: PROFILE / BACKGROUND / APPROACH / SKILLS / CURRENTLY LEARNING / WORKFLOW
//  order 숫자로 재배치 / padTop·padBottom 으로 블럭 상하 여백(rem) 조절.
const BLOCKS = {
  profile:  { order: 1, minHeight: 0, padTop: 4, padBottom: 4 },
  background:{ order: 2, minHeight: 0, padTop: 3, padBottom: 4 },
  approach:  { order: 3, minHeight: 0, padTop: 3, padBottom: 4 },
  skills:    { order: 4, minHeight: 0, padTop: 3, padBottom: 4 },
  learning:  { order: 5, minHeight: 0, padTop: 3, padBottom: 4 },
  workflow:  { order: 6, minHeight: 0, padTop: 3, padBottom: 9 },
}

export default function About() {
  const { lang } = useLanguage()
  const t = strings.about

  return (
    <div className="page-blocks">
      {/* 01 · PROFILE — 소개 statement (strings.js → about.body) */}
      <section className="about about--profile" style={blockStyle(BLOCKS.profile)}>
        <div className="container">
          <h1 className="sys-label about__label">
            <span className="about__n">01</span>{t.profileLabel[lang]}
          </h1>
          <p className="about__body about__body--lead">{t.body[lang]}</p>
        </div>
      </section>

      {/* 02 · BACKGROUND — Interior Design 기반 경로 (strings.js → about.background) */}
      <section className="about about--sec" style={blockStyle(BLOCKS.background)}>
        <div className="container">
          <h2 className="sys-label about__label">
            <span className="about__n">02</span>{t.backgroundLabel[lang]}
          </h2>
          <p className="about__body">{t.background[lang]}</p>
        </div>
      </section>

      {/* 03 · APPROACH — 공간적 사고 → 디지털·인터랙티브·실시간 (strings.js → about.approach) */}
      <section className="about about--sec" style={blockStyle(BLOCKS.approach)}>
        <div className="container">
          <h2 className="sys-label about__label">
            <span className="about__n">03</span>{t.approachLabel[lang]}
          </h2>
          <p className="about__body">{t.approach[lang]}</p>
        </div>
      </section>

      {/* 04 · SKILLS — 역할별 그룹 (숙련도 % 표기 없음). 항목은 strings.js → about.skillGroups */}
      <section className="about about--sec" style={blockStyle(BLOCKS.skills)}>
        <div className="container">
          <h2 className="sys-label about__label">
            <span className="about__n">04</span>{t.skillsLabel[lang]}
          </h2>
          <div className="about__skills">
            {t.skillGroups.map((g) => (
              <div key={g.label.en} className="about__skill-group">
                <h3 className="sys-label about__skills-label">{g.label[lang]}</h3>
                <ul className="about__skills-list">
                  {g.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05 · CURRENTLY LEARNING — EXPLORING 항목 (strings.js → evolution.exploring) */}
      <section className="about about--sec" style={blockStyle(BLOCKS.learning)}>
        <div className="container">
          <h2 className="sys-label about__label">
            <span className="about__n">05</span>{t.currentlyLearningLabel[lang]}
          </h2>
          <ul className="about__skills-list about__skills-list--muted about__learning-list">
            {strings.evolution.exploring.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      </section>

      {/* 06 · WORKFLOW — 작업 흐름 단계 (strings.js → about.workflow) */}
      <section className="about about--sec" style={blockStyle(BLOCKS.workflow)}>
        <div className="container">
          <h2 className="sys-label about__label">
            <span className="about__n">06</span>{t.workflowLabel[lang]}
          </h2>
          <ol className="about__workflow sys-label">
            {t.workflow.map((step, i) => (
              <li key={step} className="about__workflow-step">
                <span className="about__workflow-n">{String(i + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
