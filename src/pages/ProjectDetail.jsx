import { useParams, Link, Navigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import { getProjectBySlug } from '../data/projects'
import ProjectGallery from '../components/ProjectGallery'
import ProjectVideo from '../components/ProjectVideo'
import NodeGraphInteraction from '../components/NodeGraphInteraction'
import { blockStyle } from '../utils/layout'
import './ProjectDetail.css'

// 섹션(블럭) 레이아웃 설정 — 프로젝트 상세  (항목별 설명은 src/utils/layout.js 참고)
//  순서: 10 header / 20 media / 30 body(10단계 본문) / 40 next(다음 프로젝트) — order 숫자로 재배치.
//  (뒤로가기 링크는 항상 맨 위 고정. 이 페이지 블럭들은 공통 .container 안이라
//   padLeft/padRight 는 '추가 들여쓰기', maxWidth 는 '더 좁게'만 됩니다.)
const BLOCKS = {
  header: { order: 10, minHeight: 0, padTop: 0, padBottom: 4 },
  media:  { order: 20, minHeight: 0, padTop: 0, padBottom: 4 },
  body:   { order: 30, minHeight: 0, padTop: 0, padBottom: 0 },
  next:   { order: 40, minHeight: 0, padTop: 4, padBottom: 0 },
}

// 페이지 최상위(뒤로가기 링크 + 블럭들) 바깥 상하 여백(rem)
const PAGE_PAD = { top: 4, bottom: 9 }

export default function ProjectDetail() {
  const { slug } = useParams()
  const { lang } = useLanguage()
  const project = getProjectBySlug(slug)

  if (!project) return <Navigate to="/projects" replace /> // 잘못된 slug 면 목록으로 되돌림

  // ── 상세 페이지 10단계 구조 ─────────────────────────────────────────
  //  [섹션 제목]  label = strings.js → project.*
  //  [섹션 본문]  각 프로젝트의 fields[key] = src/data/projects.js 에서 수정
  //  key 값은 projects.js 의 fields 키와 반드시 일치해야 함
  //  01~04 = 노드그래프 위 / 05~07 = 노드그래프 아래 / 08 ROLE·09 TOOLS·10 LEARNING = 특수 렌더
  const sectionsAbove = [
    { n: '01', key: 'overview', label: strings.project.overview },
    { n: '02', key: 'concept', label: strings.project.concept },
    { n: '03', key: 'systemFlow', label: strings.project.systemFlow },
    { n: '04', key: 'systemArchitecture', label: strings.project.systemArchitecture },
  ]
  const sectionsBelow = [
    { n: '05', key: 'process', label: strings.project.process },
    { n: '06', key: 'experiment', label: strings.project.experiment },
    { n: '07', key: 'result', label: strings.project.result },
  ]
  const learningRows = [
    { label: strings.project.learningLearned, body: project.fields.learning.learned },
    { label: strings.project.learningDidntWork, body: project.fields.learning.didntWork },
    { label: strings.project.learningChanged, body: project.fields.learning.changed },
    { label: strings.project.learningNext, body: project.fields.learning.next },
  ]
  const nextProject = project.nextProject ? getProjectBySlug(project.nextProject) : null

  // 라벨 + 본문 한 줄 (좌: 번호·제목 / 우: 내용) — 위 그리드에 직접 배치됨
  const TextSection = ({ n, label, body }) => (
    <section className="project-detail__section">
      <h2 className="sys-label project-detail__section-label">
        {n && <span className="project-detail__section-n">{n}</span>}
        {label[lang]}
      </h2>
      <p className="project-detail__section-body">{body[lang]}</p>
    </section>
  )

  return (
    <article
      className="project-detail"
      style={{ paddingTop: `${PAGE_PAD.top}rem`, paddingBottom: `${PAGE_PAD.bottom}rem` }}
    >
      <div className="container">
        {/* [내용수정] 뒤로가기 링크 텍스트는 strings.js → project.back */}
        <Link to="/projects" className="sys-label project-detail__back">
          {strings.project.back[lang]}
        </Link>

        {/* 블럭들 — BLOCKS 의 order 순서대로 배치됨 */}
        <div className="page-blocks">
          {/* 블럭: 상세 헤더 (번호 / 제목 / 부제 / 연도·카테고리 / 툴 태그). 내용은 projects.js */}
          <header className="project-detail__header" style={blockStyle(BLOCKS.header)}>
            <span className="sys-label project-detail__index">P.{project.index}</span>
            <h1 className="project-detail__title">{project.title[lang]}</h1>
            <p className="project-detail__subtitle">{project.subtitle[lang]}</p>
            <ul className="project-detail__meta sys-label">
              <li>{strings.projectMeta.yearLabel[lang]} · {project.year}</li>
              <li>{strings.projectMeta.categoryLabel[lang]} · {(strings.filters[project.category] || strings.filters.other)[lang]}</li>
            </ul>
            <ul className="project-detail__tools sys-label">
              {project.tools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </header>

          {/* 블럭: 미디어 (스틸컷 갤러리 + 유튜브 영상) — 01 OVERVIEW 상단
              [미디어첨부] 이미지 = projects.js 의 gallery[] / 영상 = projects.js 의 video.youtubeId
              [레이아웃조정] 갤러리:영상 2단 비율은 ProjectDetail.css → .project-detail__media */}
          <div className="project-detail__media" style={blockStyle(BLOCKS.media)}>
            <ProjectGallery images={project.gallery} title={project.title[lang]} />
            <ProjectVideo youtubeId={project.video?.youtubeId} />
          </div>

          {/* 블럭: 10단계 본문
              [내용수정] 제목=strings.js project.* / 본문=projects.js fields.*
              [레이아웃조정] 좌측 라벨폭·간격은 ProjectDetail.css → .project-detail__sections */}
          <div className="project-detail__body" style={blockStyle(BLOCKS.body)}>
            {/* 01–04 : OVERVIEW / CONCEPT / SYSTEM FLOW / SYSTEM ARCHITECTURE */}
            <div className="project-detail__sections">
              {sectionsAbove.map(({ n, key, label }) => (
                <TextSection key={key} n={n} label={label} body={project.fields[key]} />
              ))}
            </div>

            {/* 노드 그래프 (components/NodeGraphInteraction.jsx) — SYSTEM ARCHITECTURE 와 PROCESS 사이,
                시스템 구조를 시각적으로 보여주는 역할. 위/아래로 옮기려면 이 블록 위치를 이동하세요. */}
            <figure className="project-detail__graph">
              <figcaption className="sys-label project-detail__graph-cap">
                SYSTEM STRUCTURE · {(strings.filters[project.category] || strings.filters.other)[lang]}
              </figcaption>
              <NodeGraphInteraction tools={project.tools} />
            </figure>

            {/* 05–07 : PROCESS / EXPERIMENT · ITERATION / RESULT */}
            <div className="project-detail__sections">
              {sectionsBelow.map(({ n, key, label }) => (
                <TextSection key={key} n={n} label={label} body={project.fields[key]} />
              ))}

              {/* 08 ROLE — 프로젝트 최상위 role 값 */}
              <TextSection n="08" label={strings.project.role} body={project.role} />

              {/* 09 TOOLS — 프로젝트 최상위 tools 배열 */}
              <section className="project-detail__section">
                <h2 className="sys-label project-detail__section-label">
                  <span className="project-detail__section-n">09</span>
                  {strings.project.tools[lang]}
                </h2>
                <ul className="project-detail__tool-list sys-label">
                  {project.tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              </section>

              {/* 10 LEARNING — 4개 하위 항목 (fields.learning) */}
              <section className="project-detail__section project-detail__section--learning">
                <h2 className="sys-label project-detail__section-label">
                  <span className="project-detail__section-n">10</span>
                  {strings.project.learning[lang]}
                </h2>
                <div className="project-detail__learning">
                  {learningRows.map(({ label, body }) => (
                    <div key={label.en} className="project-detail__learning-row">
                      <span className="sys-label project-detail__learning-label">{label[lang]}</span>
                      <p className="project-detail__section-body">{body[lang]}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* 블럭: 다음 프로젝트 연결 (projects.js 의 nextProject slug) */}
          {nextProject && (
            <nav className="project-detail__next" style={blockStyle(BLOCKS.next)}>
              <span className="sys-label project-detail__next-label">{strings.project.nextProject[lang]}</span>
              <Link to={`/projects/${nextProject.slug}`} className="project-detail__next-link">
                <span className="sys-label">P.{nextProject.index}</span>
                <span className="project-detail__next-title">{nextProject.title[lang]}</span>
                <span className="project-detail__next-sub">{nextProject.subtitle[lang]}</span>
              </Link>
            </nav>
          )}
        </div>
      </div>
    </article>
  )
}
