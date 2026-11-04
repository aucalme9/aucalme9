import { lazy, Suspense, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import { getProjectBySlug } from '../data/projects'
import ProjectGallery from '../components/ProjectGallery'
import ProjectVideo from '../components/ProjectVideo'
import NodeGraphInteraction from '../components/NodeGraphInteraction'
import { blockStyle } from '../utils/layout'
import './ProjectDetail.css'

// 3D 맵핑 미리보기 — three.js 가 무거워서 상세 페이지에 들어올 때만 따로 불러옴
const MappingStage = lazy(() => import('../components/MappingStage'))

// 섹션(블럭) 레이아웃 설정 — 프로젝트 상세  (항목별 설명은 src/utils/layout.js 참고)
//  순서: 10 header / 15 mapping(3D 맵핑 미리보기) / 20 body(본문: 핵심 내용·주요 작업…)
//        / 30 media(스틸컷·영상) / 40 next(다음 프로젝트)
//        — order 숫자로 재배치.
//  (뒤로가기 링크는 항상 맨 위 고정. 이 페이지 블럭들은 공통 .container 안이라
//   padLeft/padRight 는 '추가 들여쓰기', maxWidth 는 '더 좁게'만 됩니다.)
const BLOCKS = {
  header:  { order: 10, minHeight: 0, padTop: 0, padBottom: 4 },
  mapping: { order: 15, minHeight: 0, padTop: 0, padBottom: 4 },
  body:    { order: 20, minHeight: 0, padTop: 0, padBottom: 4 },
  media:   { order: 30, minHeight: 0, padTop: 0, padBottom: 0 },
  next:    { order: 40, minHeight: 0, padTop: 4, padBottom: 0 },
}

// 페이지 최상위(뒤로가기 링크 + 블럭들) 바깥 상하 여백(rem)
const PAGE_PAD = { top: 4, bottom: 9 }

// {ko, en} 텍스트가 실제로 채워져 있는지 (빈 문자열이면 섹션 숨김)
const has = (v) => !!(v && (v.ko || v.en))

export default function ProjectDetail() {
  const { slug } = useParams()
  const { lang } = useLanguage()
  const project = getProjectBySlug(slug)

  // 다른 프로젝트로 이동하면(하단 NEXT PROJECT 등) 페이지 맨 위에서 시작
  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  if (!project) return <Navigate to="/projects" replace /> // 잘못된 slug 면 목록으로 되돌림

  const f = project.fields || {}
  const L = strings.project
  const nextProject = project.nextProject ? getProjectBySlug(project.nextProject) : null

  // ── 본문 섹션 목록 ───────────────────────────────────────────────────
  //  내용이 있는 섹션만 표시되고, 번호(01, 02 …)는 표시되는 순서대로 자동으로 매겨집니다.
  //  [섹션 제목] strings.js → project.*   /   [섹션 내용] projects.js → fields.*
  //  [순서 변경] 아래 배열 안 줄의 순서를 바꾸면 화면 순서도 바뀝니다.
  const before = [ // 노드 그래프 위
    has(f.overview) && { key: 'overview', label: L.overview, kind: 'text', body: f.overview },
    f.keyWork?.length && { key: 'keyWork', label: L.keyWork, kind: 'list', items: f.keyWork },
    f.experiments?.length && { key: 'experiments', label: L.experiments, kind: 'named', items: f.experiments },
    f.structure?.length && { key: 'structure', label: L.structure, kind: 'flow', items: f.structure },
    has(f.concept) && { key: 'concept', label: L.concept, kind: 'text', body: f.concept },
  ].filter(Boolean)
  const after = [ // 노드 그래프 아래 (선택 항목은 넣었을 때만 표시)
    has(f.process) && { key: 'process', label: L.process, kind: 'text', body: f.process },
    has(f.experiment) && { key: 'experiment', label: L.experiment, kind: 'text', body: f.experiment },
    has(f.result) && { key: 'result', label: L.result, kind: 'text', body: f.result },
    has(project.role) && { key: 'role', label: L.role, kind: 'text', body: project.role },
    { key: 'tools', label: L.tools, kind: 'tags', items: project.tools },
    f.learning && { key: 'learning', label: L.learning, kind: 'learning', body: f.learning },
  ].filter(Boolean)
  ;[...before, ...after].forEach((s, i) => { s.n = String(i + 1).padStart(2, '0') })

  const learningRows = f.learning
    ? [
        { label: L.learningLearned, body: f.learning.learned },
        { label: L.learningDidntWork, body: f.learning.didntWork },
        { label: L.learningChanged, body: f.learning.changed },
        { label: L.learningNext, body: f.learning.next },
      ].filter((r) => has(r.body))
    : []

  // 섹션 1개 = 좌측 라벨(번호·제목) + 우측 내용. kind 에 따라 내용 모양이 달라짐.
  const Section = ({ s }) => (
    <section className={`project-detail__section project-detail__section--${s.kind}`}>
      <h2 className="sys-label project-detail__section-label">
        <span className="project-detail__section-n">{s.n}</span>
        {s.label[lang]}
      </h2>

      {s.kind === 'text' && <p className="project-detail__section-body">{s.body[lang]}</p>}

      {/* 주요 작업 — 번호 붙은 한 줄 목록 */}
      {s.kind === 'list' && (
        <ol className="project-detail__list">
          {s.items.map((it, i) => (
            <li key={i}>
              <span className="sys-label project-detail__list-n">{String(i + 1).padStart(2, '0')}</span>
              <span>{it[lang]}</span>
            </li>
          ))}
        </ol>
      )}

      {/* 주요 실험 — 이름(보라) + 설명 */}
      {s.kind === 'named' && (
        <ul className="project-detail__list project-detail__list--named">
          {s.items.map((it) => (
            <li key={it.name}>
              <span className="sys-label project-detail__list-name">{it.name}</span>
              <span>{it[lang]}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 구현 구조 — 단계 → 단계 → 단계 */}
      {s.kind === 'flow' && (
        <ol className="project-detail__flow sys-label">
          {s.items.flatMap((step, i) => [
            i > 0 && <li key={`a${i}`} className="project-detail__flow-arrow" aria-hidden="true">→</li>,
            <li key={step}>
              <span className="project-detail__flow-n">{String(i + 1).padStart(2, '0')}</span>
              {step}
            </li>,
          ])}
        </ol>
      )}

      {s.kind === 'tags' && (
        <ul className="project-detail__tool-list sys-label">
          {s.items.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
      )}

      {s.kind === 'learning' && (
        <div className="project-detail__learning">
          {learningRows.map(({ label, body }) => (
            <div key={label.en} className="project-detail__learning-row">
              <span className="sys-label project-detail__learning-label">{label[lang]}</span>
              <p className="project-detail__section-body">{body[lang]}</p>
            </div>
          ))}
        </div>
      )}
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
          {/* 블럭: 상세 헤더 (번호 / 제목 / 부제 / 카테고리·연도 / 툴 태그). 내용은 projects.js */}
          <header className="project-detail__header" style={blockStyle(BLOCKS.header)}>
            <span className="sys-label project-detail__index">P.{project.index}</span>
            <h1 className="project-detail__title">{project.title[lang]}</h1>
            <p className="project-detail__subtitle">{project.subtitle[lang]}</p>
            <ul className="project-detail__meta sys-label">
              <li>{strings.projectMeta.categoryLabel[lang]} · {project.categoryLabel[lang]}</li>
              {project.year && <li>{strings.projectMeta.yearLabel[lang]} · {project.year}</li>}
            </ul>
            <ul className="project-detail__tools sys-label">
              {project.tools.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </header>

          {/* 블럭: 맵핑 미리보기 (3D 뷰어 — 분할 / 반구형 / 3면 벽 + 스펙 카드 4장)
              [내용수정] 프로젝트별 값 = projects.js 의 mapping / 라벨 = strings.js 의 mapping
              [레이아웃조정] src/components/MappingStage.css
              [숨기기] projects.js 에서 해당 프로젝트의 mapping 줄을 지우면 이 블럭이 사라집니다. */}
          {project.mapping && (
            <div className="project-detail__mapping" style={blockStyle(BLOCKS.mapping)}>
              <Suspense fallback={<div className="project-detail__mapping-loading sys-label">LOADING MAPPING PREVIEW…</div>}>
                <MappingStage project={project} lang={lang} />
              </Suspense>
            </div>
          )}

          {/* 블럭: 미디어 (스틸컷 갤러리 + 유튜브 영상)
              [미디어첨부] 이미지 = projects.js 의 gallery[] / 영상 = projects.js 의 video.youtubeId
              [레이아웃조정] 갤러리:영상 2단 비율은 ProjectDetail.css → .project-detail__media */}
          <div className="project-detail__media" style={blockStyle(BLOCKS.media)}>
            <ProjectGallery key={project.slug} images={project.gallery} title={project.title[lang]} />
            <ProjectVideo youtubeId={project.video?.youtubeId} />
          </div>

          {/* 블럭: 본문
              [레이아웃조정] 좌측 라벨폭·간격은 ProjectDetail.css → .project-detail__sections */}
          <div className="project-detail__body" style={blockStyle(BLOCKS.body)}>
            <div className="project-detail__sections">
              {before.map((s) => <Section key={s.key} s={s} />)}
            </div>

            {/* 노드 그래프 (components/NodeGraphInteraction.jsx) — 시스템 구조 시각화.
                fields.structure 가 있으면 그 단계들로, 없으면 INPUT → 첫 번째 툴 → OUTPUT */}
            <figure className="project-detail__graph">
              <figcaption className="sys-label project-detail__graph-cap">
                SYSTEM STRUCTURE · {project.categoryLabel[lang]}
              </figcaption>
              <NodeGraphInteraction key={project.slug} tools={project.tools} steps={f.structure} />
            </figure>

            <div className="project-detail__sections">
              {after.map((s) => <Section key={s.key} s={s} />)}
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
