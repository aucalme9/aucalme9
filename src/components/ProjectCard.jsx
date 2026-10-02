import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import './ProjectCard.css'

export default function ProjectCard({ project }) {
  const { lang } = useLanguage()
  const [imgError, setImgError] = useState(false)

  return (
    // 카드 = 목록/홈에서 반복되는 한 칸. 클릭 시 /projects/<slug> 상세로 이동.
    // [레이아웃조정] 카드 테두리·hover 효과는 src/components/ProjectCard.css → .project-card
    <Link to={`/projects/${project.slug}`} className="project-card">
      {/* 썸네일 영역.
          [미디어첨부] 이미지는 projects.js 의 cover 경로로 지정
          [레이아웃조정] 썸네일 비율은 ProjectCard.css → .project-card__frame
                         (목록 페이지에서는 ProjectsList.jsx BLOCKS.list.cardRatio 로 덮어씀) */}
      <div className="project-card__frame">
        {!imgError ? (
          <img
            src={project.cover}
            alt={project.title[lang]}
            onError={() => setImgError(true)}         /* 로드 실패 시 NO_SIGNAL 표시 */
            loading="lazy"
          />
        ) : (
          <div className="project-card__placeholder sys-label">NO_SIGNAL</div>
        )}
        {/* [레이아웃조정] 좌상단 번호표 위치는 ProjectCard.css → .project-card__index (top/left) */}
        <span className="project-card__index sys-label">P.{project.index}</span>
      </div>

      {/* 카드 하단 텍스트. 내용은 전부 projects.js 에서 옴 (title / subtitle / tools).
          [레이아웃조정] 안쪽 여백은 ProjectCard.css → .project-card__body (padding) */}
      <div className="project-card__body">
        <h3 className="project-card__title">{project.title[lang]}</h3>
        <p className="project-card__subtitle">{project.subtitle[lang]}</p>
        {/* 메타: YEAR / TYPE / ROLE (내용은 projects.js) */}
        <p className="project-card__meta sys-label">
          {project.year} · {(strings.filters[project.category] || strings.filters.other)[lang]}
          {project.role?.[lang] ? ` · ${project.role[lang]}` : ''}
        </p>
        <ul className="project-card__tools sys-label">
          {project.tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
      </div>
    </Link>
  )
}
