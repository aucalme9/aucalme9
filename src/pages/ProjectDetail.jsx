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
//  현재 순서: 10 header / 20 media / 30 body(본문 6섹션) / 40 graph — order 숫자로 재배치.
//  (뒤로가기 링크는 항상 맨 위 고정. 이 페이지 블럭들은 공통 .container 안이라
//   padLeft/padRight 는 '추가 들여쓰기', maxWidth 는 '더 좁게'만 됩니다.)
const BLOCKS = {
  header: { order: 10, minHeight: 0, padTop: 0, padBottom: 4 },
  media:  { order: 20, minHeight: 0, padTop: 0, padBottom: 4 },
  body:   { order: 30, minHeight: 0, padTop: 0, padBottom: 0 },
  graph:  { order: 40, minHeight: 0, padTop: 4, padBottom: 4 },
}

// 페이지 최상위(뒤로가기 링크 + 블럭들) 바깥 상하 여백(rem)
const PAGE_PAD = { top: 4, bottom: 9 }

export default function ProjectDetail() {
  const { slug } = useParams()
  const { lang } = useLanguage()
  const project = getProjectBySlug(slug)

  if (!project) return <Navigate to="/projects" replace /> // 잘못된 slug 면 목록으로 되돌림

  // ── 상세 페이지 본문 섹션 순서 ───────────────────────────────────────
  //  [섹션 순서 변경] 이 배열의 줄 순서를 바꾸면 화면 표시 순서도 바뀜
  //  [섹션 제목]  label = strings.js → project.* 에서 수정
  //  [섹션 본문]  각 프로젝트의 fields[key] = src/data/projects.js 에서 수정
  //  key 값(overview/concept/...)은 projects.js 의 fields 키와 반드시 일치해야 함
  const sections = [
    { key: 'overview', label: strings.project.overview },
    { key: 'concept', label: strings.project.concept },
    { key: 'process', label: strings.project.process },
    { key: 'technical', label: strings.project.technical },
    { key: 'result', label: strings.project.result },
    { key: 'role', label: strings.project.role },
  ]

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
          {/* 블럭: 상세 헤더 (번호 / 제목 / 부제 / 툴 태그). 내용은 projects.js */}
          <header className="project-detail__header" style={blockStyle(BLOCKS.header)}>
            <span className="sys-label project-detail__index">P.{project.index}</span>
            <h1 className="project-detail__title">{project.title[lang]}</h1>
            <p className="project-detail__subtitle">{project.subtitle[lang]}</p>
            <ul className="project-detail__tools sys-label">
              {project.tools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </header>

          {/* 블럭: 미디어 (스틸컷 갤러리 + 유튜브 영상)
              [미디어첨부] 이미지 = projects.js 의 gallery[] / 영상 = projects.js 의 video.youtubeId
              [레이아웃조정] 갤러리:영상 2단 비율은 ProjectDetail.css → .project-detail__media */}
          <div className="project-detail__media" style={blockStyle(BLOCKS.media)}>
            <ProjectGallery images={project.gallery} title={project.title[lang]} />
            <ProjectVideo youtubeId={project.video?.youtubeId} />
          </div>

          {/* 블럭: 본문 6섹션 (한 덩어리)
              [내용수정] 제목=strings.js project.* / 본문=projects.js fields.*
              [레이아웃조정] 좌측 라벨폭·간격은 ProjectDetail.css → .project-detail__sections */}
          <div className="project-detail__sections" style={blockStyle(BLOCKS.body)}>
            {sections.map(({ key, label }) => (
              <section key={key} className="project-detail__section">
                <h2 className="sys-label project-detail__section-label">{label[lang]}</h2>
                <p className="project-detail__section-body">{project.fields[key][lang]}</p>
              </section>
            ))}
          </div>

          {/* 블럭: 노드 그래프 (컴포넌트: components/NodeGraphInteraction.jsx)
              위로 올리려면 BLOCKS.graph.order 를 낮추세요 (예: 25 → 본문 위) */}
          <div className="project-detail__graph" style={blockStyle(BLOCKS.graph)}>
            <NodeGraphInteraction tools={project.tools} />
          </div>
        </div>
      </div>
    </article>
  )
}
