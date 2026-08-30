// ============================================================================
//  프로젝트 데이터 - UI 코드와 완전히 분리
//  이 파일의 값만 교체하면 목록/상세/홈 Featured 전체에 자동 반영됩니다.
//
//  ── 무엇을 어디서 바꾸나 ──────────────────────────────────────────────
//   [내용수정]   title / subtitle / fields.* 의 따옴표 안 텍스트 (ko·en 각각)
//   [미디어첨부] cover / gallery[] / video.youtubeId 의 경로·ID 값
//   [항목 추가]  { ... } 블록을 통째로 복사해 배열에 붙이면 프로젝트가 늘어납니다.
//                (id·slug 는 서로 겹치지 않게, index 는 화면 표시용 번호)
//
//  ── 이미지 / 영상 파일 넣는 위치 [미디어첨부] ────────────────────────
//   경로 규칙:  /assets/projects/project-XX/{cover|process|result}/파일명
//   실제 파일은  public/assets/projects/project-XX/... 폴더에 저장하세요.
//   (public 안의 파일은 빌드 시 위 경로 그대로 서비스됩니다. 폴더는 생성돼 있음)
//     - cover        : 카드 썸네일 + 상세 헤더용 대표 이미지 1장
//     - gallery[]     : 상세 페이지 스틸컷 슬라이드 (여러 장, 순서대로 표시)
//     - video.youtubeId : 유튜브 '보기' URL 의  v=  뒤 11자리 값만  (예: 'dQw4w9WgXcQ')
//                         빈 문자열('')이면 영상 자리에 NO_SIGNAL 안내가 표시됩니다.
//   * 파일이 없거나 경로가 틀리면 자동으로 NO_SIGNAL 플레이스홀더로 대체됩니다.
// ============================================================================

export const projects = [
  // ┌─────────────────────────────────────────────────────────────────────┐
  // │ 프로젝트 01 — 아래 블록이 나머지 프로젝트의 작성 템플릿입니다.       │
  // └─────────────────────────────────────────────────────────────────────┘
  {
    id: 'project-01',        // 내부 식별자 (겹치지 않게). 보통 slug 와 동일하게 둡니다.
    slug: 'project-01',      // URL 주소: /projects/project-01  ← 영문·숫자·하이픈만
    index: '01',             // [내용수정] 화면에 보이는 번호표 (P.01)
    tools: ['TouchDesigner'], // [내용수정] 사용 툴 태그. 배열에 여러 개 추가 가능. 상세 노드그래프 첫 노드에도 사용됨
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명 (카드·상세 부제)
      ko: 'TouchDesigner 기반 실시간 인터랙티브 설치',
      en: 'Real-time Interactive Installation with TouchDesigner',
    },
    cover: '/assets/projects/project-01/cover/placeholder.jpg', // [미디어첨부] 대표 이미지 1장
    gallery: [               // [미디어첨부] 상세 페이지 스틸컷 (원하는 만큼 줄 추가/삭제)
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID 11자리만. 비우면 영상 영역 숨김 처리(NO_SIGNAL)
    fields: {                // [내용수정] 상세 페이지 본문 6개 섹션. ko·en 각각 작성.
      overview: { ko: '[Overview — 무엇을 만들었는지 한 줄 요약 placeholder]', en: '[Overview placeholder]' },
      concept: { ko: '[Concept — 출발점이 된 아이디어/문제의식 placeholder]', en: '[Concept placeholder]' },
      process: { ko: '[Process — 제작 과정 placeholder]', en: '[Process placeholder]' },
      technical: { ko: '[Technical/System — 구현 구조, 신호/데이터 흐름 placeholder]', en: '[Technical/System placeholder]' },
      result: { ko: '[Result — 최종 결과물, 전시/발표 이력 placeholder]', en: '[Result placeholder]' },
      role: { ko: '[Role — 본인 역할 placeholder]', en: '[Role placeholder]' },
    },
  },

  // ── 프로젝트 02 ──────────────────────────────────────────────────────
  {
    id: 'project-02',
    slug: 'project-02',
    index: '02',             // [내용수정] 번호표
    tools: ['Blender'],      // [내용수정] 사용 툴 태그
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명
      ko: 'Blender 기반 공간 내러티브 3D 애니메이션',
      en: 'Spatial Narrative 3D Animation with Blender',
    },
    cover: '/assets/projects/project-02/cover/placeholder.jpg', // [미디어첨부] 대표 이미지
    gallery: [               // [미디어첨부] 스틸컷 목록 (지금은 project-01 이미지를 임시 참조 중)
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID
    fields: {                // [내용수정] 상세 본문 6섹션
      overview: { ko: '[Overview placeholder]', en: '[Overview placeholder]' },
      concept: { ko: '[Concept placeholder]', en: '[Concept placeholder]' },
      process: { ko: '[Process placeholder]', en: '[Process placeholder]' },
      technical: { ko: '[Technical/System placeholder]', en: '[Technical/System placeholder]' },
      result: { ko: '[Result placeholder]', en: '[Result placeholder]' },
      role: { ko: '[Role placeholder]', en: '[Role placeholder]' },
    },
  },

  // ── 프로젝트 03 ──────────────────────────────────────────────────────
  {
    id: 'project-03',
    slug: 'project-03',
    index: '03',             // [내용수정] 번호표
    tools: ['AI / Generative Workflow'], // [내용수정] 사용 툴 태그
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명
      ko: 'AI / Generative Workflow 기반 비주얼 익스페리먼트',
      en: 'Visual Experiment with AI / Generative Workflow',
    },
    cover: '/assets/projects/project-03/cover/placeholder.jpg', // [미디어첨부] 대표 이미지
    gallery: [               // [미디어첨부] 스틸컷 목록
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID
    fields: {                // [내용수정] 상세 본문 6섹션
      overview: { ko: '[Overview placeholder]', en: '[Overview placeholder]' },
      concept: { ko: '[Concept placeholder]', en: '[Concept placeholder]' },
      process: { ko: '[Process placeholder]', en: '[Process placeholder]' },
      technical: { ko: '[Technical/System placeholder]', en: '[Technical/System placeholder]' },
      result: { ko: '[Result placeholder]', en: '[Result placeholder]' },
      role: { ko: '[Role placeholder]', en: '[Role placeholder]' },
    },
  },

  // ── 프로젝트 04 ──────────────────────────────────────────────────────
  {
    id: 'project-04',
    slug: 'project-04',
    index: '04',             // [내용수정] 번호표
    tools: ['TouchDesigner'], // [내용수정] 사용 툴 태그
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명
      ko: '센서 연동 인터랙티브 미디어 파사드',
      en: 'Sensor-driven Interactive Media Facade',
    },
    cover: '/assets/projects/project-04/cover/placeholder.jpg', // [미디어첨부] 대표 이미지
    gallery: [               // [미디어첨부] 스틸컷 목록
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID
    fields: {                // [내용수정] 상세 본문 6섹션
      overview: { ko: '[Overview placeholder]', en: '[Overview placeholder]' },
      concept: { ko: '[Concept placeholder]', en: '[Concept placeholder]' },
      process: { ko: '[Process placeholder]', en: '[Process placeholder]' },
      technical: { ko: '[Technical/System placeholder]', en: '[Technical/System placeholder]' },
      result: { ko: '[Result placeholder]', en: '[Result placeholder]' },
      role: { ko: '[Role placeholder]', en: '[Role placeholder]' },
    },
  },

  // ── 프로젝트 05 ──────────────────────────────────────────────────────
  {
    id: 'project-05',
    slug: 'project-05',
    index: '05',             // [내용수정] 번호표
    tools: ['Blender'],      // [내용수정] 사용 툴 태그
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명
      ko: '프로시저럴 워크플로우 기반 3D 실험',
      en: 'Procedural Workflow-based 3D Experiment',
    },
    cover: '/assets/projects/project-05/cover/placeholder.jpg', // [미디어첨부] 대표 이미지
    gallery: [               // [미디어첨부] 스틸컷 목록
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID
    fields: {                // [내용수정] 상세 본문 6섹션
      overview: { ko: '[Overview placeholder]', en: '[Overview placeholder]' },
      concept: { ko: '[Concept placeholder]', en: '[Concept placeholder]' },
      process: { ko: '[Process placeholder]', en: '[Process placeholder]' },
      technical: { ko: '[Technical/System placeholder]', en: '[Technical/System placeholder]' },
      result: { ko: '[Result placeholder]', en: '[Result placeholder]' },
      role: { ko: '[Role placeholder]', en: '[Role placeholder]' },
    },
  },

  // ── 프로젝트 06 ──────────────────────────────────────────────────────
  {
    id: 'project-06',
    slug: 'project-06',
    index: '06',             // [내용수정] 번호표
    tools: ['Interactive Media / Real-time Visual'], // [내용수정] 사용 툴 태그
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명
      ko: '공간 디자인 사고 기반 미디어아트 설치',
      en: 'Media Art Installation Rooted in Spatial Design Thinking',
    },
    cover: '/assets/projects/project-06/cover/placeholder.jpg', // [미디어첨부] 대표 이미지
    gallery: [               // [미디어첨부] 스틸컷 목록
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID
    fields: {                // [내용수정] 상세 본문 6섹션
      overview: { ko: '[Overview placeholder]', en: '[Overview placeholder]' },
      concept: { ko: '[Concept placeholder]', en: '[Concept placeholder]' },
      process: { ko: '[Process placeholder]', en: '[Process placeholder]' },
      technical: { ko: '[Technical/System placeholder]', en: '[Technical/System placeholder]' },
      result: { ko: '[Result placeholder]', en: '[Result placeholder]' },
      role: { ko: '[Role placeholder]', en: '[Role placeholder]' },
    },
  },
]

// slug(URL) 로 프로젝트 하나를 찾아 반환 — 상세 페이지에서 사용. (수정 불필요)
export function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug)
}
