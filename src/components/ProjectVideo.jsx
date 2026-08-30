// 상세 페이지의 유튜브 임베드 플레이어.
//  [미디어첨부] 영상 ID 는 이 파일이 아니라 src/data/projects.js 의 video.youtubeId 에 입력.
//  [레이아웃조정] 플레이어 비율(16:9)·테두리는 src/components/ProjectVideo.css → .project-video
import './ProjectVideo.css'

export default function ProjectVideo({ youtubeId }) {
  // ID 가 비어 있으면(projects.js 에서 '') 영상 대신 안내 박스를 표시.
  if (!youtubeId) {
    // [내용수정] 영상 미첨부 시 보이는 안내 문구
    return <div className="project-video project-video--empty sys-label">NO_SIGNAL — VIDEO LINK PENDING</div>
  }

  return (
    <div className="project-video">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}`} /* projects.js 의 youtubeId 가 여기 들어감 */
        title="Project video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}