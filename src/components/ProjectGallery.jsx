// 상세 페이지의 스틸컷 슬라이드(‹ › 로 넘김).
//  [미디어첨부] 이미지 목록은 이 파일이 아니라 src/data/projects.js 의 gallery[] 배열에 입력.
//  [레이아웃조정] 프레임 비율·화살표 버튼 위치·카운터 위치는
//                 src/components/ProjectGallery.css (.project-gallery__frame / __nav / __counter)
import { useState } from 'react'
import './ProjectGallery.css'

export default function ProjectGallery({ images = [], title = '' }) {
  const [index, setIndex] = useState(0)      // 현재 보이는 스틸컷 번호
  const [errored, setErrored] = useState({}) // 로드 실패한 이미지 기록

  // gallery 배열이 비어 있으면 안내 박스 표시.
  if (images.length === 0) {
    // [내용수정] 스틸컷 미첨부 시 보이는 안내 문구
    return <div className="project-gallery project-gallery--empty sys-label">NO_SIGNAL — STILL CUTS PENDING</div>
  }

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length)
  const next = () => setIndex((i) => (i + 1) % images.length)

  return (
    <div className="project-gallery">
      <div className="project-gallery__frame">
        {!errored[index] ? (
          <img
            src={images[index]}
            alt={`${title} still ${index + 1}`}
            onError={() => setErrored((p) => ({ ...p, [index]: true }))}
          />
        ) : (
          <div className="project-gallery__placeholder sys-label">NO_SIGNAL</div>
        )}
        {/* [내용수정] 이전/다음 버튼에 보이는 기호(‹ ›) 변경 가능.
            [레이아웃조정] 버튼 위치·크기는 ProjectGallery.css → .project-gallery__nav(--prev/--next) */}
        <button className="project-gallery__nav project-gallery__nav--prev" onClick={prev} aria-label="Previous still">‹</button>
        <button className="project-gallery__nav project-gallery__nav--next" onClick={next} aria-label="Next still">›</button>
        {/* [레이아웃조정] "01 / 03" 카운터 위치는 ProjectGallery.css → .project-gallery__counter */}
        <span className="project-gallery__counter sys-label">
          {String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}