import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import { blockStyle } from '../utils/layout'
import './About.css'

// 섹션(블럭) 레이아웃 설정 — About  (항목별 설명은 src/utils/layout.js 참고)
//  현재 순서: 1 intro(소개 글) / 2 skills(스킬 목록) — order 숫자로 재배치.
const BLOCKS = {
  intro:  { order: 1, minHeight: 0, padTop: 4, padBottom: 4 },
  skills: { order: 2, minHeight: 0, padTop: 3, padBottom: 9 },
}

export default function About() {
  const { lang } = useLanguage()

  return (
    <div className="page-blocks">
      {/* 블럭: 소개 글 (순서·여백은 BLOCKS.intro) */}
      <section className="about about--intro" style={blockStyle(BLOCKS.intro)}>
        <div className="container">
          {/* [내용수정] 제목·소개 본문은 strings.js → about.label / about.body */}
          <h1 className="sys-label about__label">{strings.about.label[lang]}</h1>
          <p className="about__body">{strings.about.body[lang]}</p>
        </div>
      </section>

      {/* 블럭: 스킬 목록 2단 (순서·여백은 BLOCKS.skills)
          [내용수정] 라벨/항목은 모두 strings.js → about.coreSkills* / learningSkills* */}
      <section className="about about--skills" style={blockStyle(BLOCKS.skills)}>
        <div className="container">
          <div className="about__skills">
            <div>
              <h2 className="sys-label about__skills-label">{strings.about.coreSkillsLabel[lang]}</h2>
              <ul className="about__skills-list">
                {strings.about.coreSkills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="sys-label about__skills-label">
                {strings.about.learningSkillsLabel[lang]}
              </h2>
              {/* --muted 클래스 = 흐린 색. [레이아웃조정] 색은 About.css → .about__skills-list--muted */}
              <ul className="about__skills-list about__skills-list--muted">
                {strings.about.learningSkills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
