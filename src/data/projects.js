// ============================================================================
//  프로젝트 데이터 - UI 코드와 완전히 분리
//  이 파일의 값만 교체하면 목록/상세/홈 Selected Works 전체에 자동 반영됩니다.
//
//  ── 무엇을 어디서 바꾸나 ──────────────────────────────────────────────
//   [내용수정]   title / subtitle / role / fields.* 의 따옴표 안 텍스트 (ko·en 각각)
//   [분류값]     year(연도) / category(아래 카테고리 키 중 하나) / nextProject(다음 프로젝트 slug)
//   [미디어첨부] cover / gallery[] / video.youtubeId 의 경로·ID 값
//   [항목 추가]  { ... } 블록을 통째로 복사해 배열에 붙이면 프로젝트가 늘어납니다.
//                (id·slug 는 서로 겹치지 않게, index 는 화면 표시용 번호)
//
//  ── category 키 (목록 페이지 필터에 사용) [분류값] ───────────────────
//     'media-art' | 'generative' | 'interactive' | '3d'
//     'audio-reactive' | 'experiment' | 'other'
//     (라벨 텍스트·'ALL' 항목은 src/i18n/strings.js → filters.* 에서 관리)
//   ※ 아래 각 프로젝트의 category 값은 기존 부제에서 임시로 분류한 것 [검토]. 확정 시 교체.
//
//  ── 상세 페이지 10단계 구조 (src/pages/ProjectDetail.jsx 가 이 순서로 렌더) ──
//     01 OVERVIEW              fields.overview
//     02 CONCEPT               fields.concept
//     03 SYSTEM FLOW           fields.systemFlow
//     04 SYSTEM ARCHITECTURE   fields.systemArchitecture   (구 'technical')
//     05 PROCESS               fields.process
//     06 EXPERIMENT / ITERATION fields.experiment
//     07 RESULT                fields.result
//     08 ROLE                  role            (프로젝트 최상위 값)
//     09 TOOLS                 tools           (프로젝트 최상위 배열)
//     10 LEARNING              fields.learning.{learned, didntWork, changed, next}
//
//  ── 이미지 / 영상 파일 넣는 위치 [미디어첨부] ────────────────────────
//   경로 규칙:  /assets/projects/project-XX/{cover|process|result}/파일명
//   실제 파일은  public/assets/projects/project-XX/... 폴더에 저장하세요.
//     - cover        : 카드 썸네일 + 상세 헤더용 대표 이미지 1장
//     - gallery[]     : 상세 페이지 스틸컷 슬라이드 (여러 장, 순서대로 표시)
//     - video.youtubeId : 유튜브 '보기' URL 의  v=  뒤 11자리 값만  (예: 'dQw4w9WgXcQ')
//                         빈 문자열('')이면 영상 자리에 NO_SIGNAL 안내가 표시됩니다.
//   * 파일이 없거나 경로가 틀리면 자동으로 NO_SIGNAL 플레이스홀더로 대체됩니다.
// ============================================================================

// 상세 10단계 중 fields.learning 하위 4항목 (10 LEARNING 섹션에서 이 순서로 표시)
//  값은 전부 placeholder — 실제 회고 내용은 확정 후 교체 [내용수정]
const LEARNING_PLACEHOLDER = () => ({
  learned:   { ko: '[What I learned — 이 프로젝트에서 배운 것 placeholder]', en: '[What I learned placeholder]' },
  didntWork: { ko: "[What didn't work — 잘 안 됐던 시도 placeholder]", en: "[What didn't work placeholder]" },
  changed:   { ko: '[What I changed — 그래서 바꾼 것 placeholder]', en: '[What I changed placeholder]' },
  next:      { ko: '[Next step — 다음 단계로 이어질 지점 placeholder]', en: '[Next step placeholder]' },
})

export const projects = [
  // ┌─────────────────────────────────────────────────────────────────────┐
  // │ 프로젝트 01 — 아래 블록이 나머지 프로젝트의 작성 템플릿입니다.       │
  // └─────────────────────────────────────────────────────────────────────┘
  {
    id: 'project-01',        // 내부 식별자 (겹치지 않게). 보통 slug 와 동일하게 둡니다.
    slug: 'project-01',      // URL 주소: /projects/project-01  ← 영문·숫자·하이픈만
    index: '01',             // [내용수정] 화면에 보이는 번호표 (P.01)
    year: '[YYYY]',          // [분류값] 제작 연도 (카드 메타 · 아카이브 정렬용)
    category: 'interactive', // [분류값][검토] 목록 필터 카테고리 키 (위 주석 참조)
    tools: ['TouchDesigner'], // [내용수정] 사용 툴 태그. 배열에 여러 개 추가 가능. 09 TOOLS + 노드그래프 첫 노드에도 사용됨
    role: { ko: '[Role — 본인 역할 placeholder]', en: '[Role placeholder]' }, // [내용수정] 08 ROLE + 카드 메타
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명 (카드·상세 부제)
      ko: 'TouchDesigner 기반 실시간 인터랙티브 설치',
      en: 'Real-time Interactive Installation with TouchDesigner',
    },
    nextProject: 'project-02', // [분류값] 상세 페이지 하단 "다음 프로젝트" 연결 (slug). 없으면 '' 로.
    cover: '/assets/projects/project-01/cover/placeholder.jpg', // [미디어첨부] 대표 이미지 1장
    gallery: [               // [미디어첨부] 상세 페이지 스틸컷 (원하는 만큼 줄 추가/삭제)
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID 11자리만. 비우면 영상 영역 숨김 처리(NO_SIGNAL)
    fields: {                // [내용수정] 상세 페이지 본문. ko·en 각각 작성. (10단계 매핑은 위 주석 참조)
      overview:            { ko: '[Overview — 무엇을 만들었는지 한 줄 요약 placeholder]', en: '[Overview placeholder]' },
      concept:             { ko: '[Concept — 출발점이 된 아이디어/문제의식 placeholder]', en: '[Concept placeholder]' },
      systemFlow:          { ko: '[System Flow — 입력→처리→출력 신호 흐름 placeholder]', en: '[System Flow placeholder]' },
      systemArchitecture:  { ko: '[System Architecture — 구현 구조, 모듈/데이터 구성 placeholder]', en: '[System Architecture placeholder]' },
      process:             { ko: '[Process — 제작 과정 placeholder]', en: '[Process placeholder]' },
      experiment:          { ko: '[Experiment / Iteration — 초기 스케치·레퍼런스·실패한 실험·Before/After placeholder]', en: '[Experiment / Iteration placeholder]' },
      result:             { ko: '[Result — 최종 결과물, 전시/발표 이력 placeholder]', en: '[Result placeholder]' },
      learning: LEARNING_PLACEHOLDER(),
    },
  },

  // ── 프로젝트 02 ──────────────────────────────────────────────────────
  {
    id: 'project-02',
    slug: 'project-02',
    index: '02',             // [내용수정] 번호표
    year: '[YYYY]',          // [분류값]
    category: '3d',          // [분류값][검토]
    tools: ['Blender'],      // [내용수정] 사용 툴 태그
    role: { ko: '[Role placeholder]', en: '[Role placeholder]' }, // [내용수정]
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명
      ko: 'Blender 기반 공간 내러티브 3D 애니메이션',
      en: 'Spatial Narrative 3D Animation with Blender',
    },
    nextProject: 'project-03', // [분류값]
    cover: '/assets/projects/project-02/cover/placeholder.jpg', // [미디어첨부] 대표 이미지
    gallery: [               // [미디어첨부] 스틸컷 목록 (지금은 project-01 이미지를 임시 참조 중)
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID
    fields: {                // [내용수정] 상세 본문
      overview:            { ko: '[Overview placeholder]', en: '[Overview placeholder]' },
      concept:             { ko: '[Concept placeholder]', en: '[Concept placeholder]' },
      systemFlow:          { ko: '[System Flow placeholder]', en: '[System Flow placeholder]' },
      systemArchitecture:  { ko: '[System Architecture placeholder]', en: '[System Architecture placeholder]' },
      process:             { ko: '[Process placeholder]', en: '[Process placeholder]' },
      experiment:          { ko: '[Experiment / Iteration placeholder]', en: '[Experiment / Iteration placeholder]' },
      result:             { ko: '[Result placeholder]', en: '[Result placeholder]' },
      learning: LEARNING_PLACEHOLDER(),
    },
  },

  // ── 프로젝트 03 ──────────────────────────────────────────────────────
  {
    id: 'project-03',
    slug: 'project-03',
    index: '03',             // [내용수정] 번호표
    year: '[YYYY]',          // [분류값]
    category: 'generative',  // [분류값][검토]
    tools: ['AI / Generative Workflow'], // [내용수정] 사용 툴 태그
    role: { ko: '[Role placeholder]', en: '[Role placeholder]' }, // [내용수정]
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명
      ko: 'AI / Generative Workflow 기반 비주얼 익스페리먼트',
      en: 'Visual Experiment with AI / Generative Workflow',
    },
    nextProject: 'project-04', // [분류값]
    cover: '/assets/projects/project-03/cover/placeholder.jpg', // [미디어첨부] 대표 이미지
    gallery: [               // [미디어첨부] 스틸컷 목록
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID
    fields: {                // [내용수정] 상세 본문
      overview:            { ko: '[Overview placeholder]', en: '[Overview placeholder]' },
      concept:             { ko: '[Concept placeholder]', en: '[Concept placeholder]' },
      systemFlow:          { ko: '[System Flow placeholder]', en: '[System Flow placeholder]' },
      systemArchitecture:  { ko: '[System Architecture placeholder]', en: '[System Architecture placeholder]' },
      process:             { ko: '[Process placeholder]', en: '[Process placeholder]' },
      experiment:          { ko: '[Experiment / Iteration placeholder]', en: '[Experiment / Iteration placeholder]' },
      result:             { ko: '[Result placeholder]', en: '[Result placeholder]' },
      learning: LEARNING_PLACEHOLDER(),
    },
  },

  // ── 프로젝트 04 ──────────────────────────────────────────────────────
  {
    id: 'project-04',
    slug: 'project-04',
    index: '04',             // [내용수정] 번호표
    year: '[YYYY]',          // [분류값]
    category: 'interactive', // [분류값][검토]
    tools: ['TouchDesigner'], // [내용수정] 사용 툴 태그
    role: { ko: '[Role placeholder]', en: '[Role placeholder]' }, // [내용수정]
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명
      ko: '센서 연동 인터랙티브 미디어 파사드',
      en: 'Sensor-driven Interactive Media Facade',
    },
    nextProject: 'project-05', // [분류값]
    cover: '/assets/projects/project-04/cover/placeholder.jpg', // [미디어첨부] 대표 이미지
    gallery: [               // [미디어첨부] 스틸컷 목록
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID
    fields: {                // [내용수정] 상세 본문
      overview:            { ko: '[Overview placeholder]', en: '[Overview placeholder]' },
      concept:             { ko: '[Concept placeholder]', en: '[Concept placeholder]' },
      systemFlow:          { ko: '[System Flow placeholder]', en: '[System Flow placeholder]' },
      systemArchitecture:  { ko: '[System Architecture placeholder]', en: '[System Architecture placeholder]' },
      process:             { ko: '[Process placeholder]', en: '[Process placeholder]' },
      experiment:          { ko: '[Experiment / Iteration placeholder]', en: '[Experiment / Iteration placeholder]' },
      result:             { ko: '[Result placeholder]', en: '[Result placeholder]' },
      learning: LEARNING_PLACEHOLDER(),
    },
  },

  // ── 프로젝트 05 ──────────────────────────────────────────────────────
  {
    id: 'project-05',
    slug: 'project-05',
    index: '05',             // [내용수정] 번호표
    year: '[YYYY]',          // [분류값]
    category: '3d',          // [분류값][검토]
    tools: ['Blender'],      // [내용수정] 사용 툴 태그
    role: { ko: '[Role placeholder]', en: '[Role placeholder]' }, // [내용수정]
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명
      ko: '프로시저럴 워크플로우 기반 3D 실험',
      en: 'Procedural Workflow-based 3D Experiment',
    },
    nextProject: 'project-06', // [분류값]
    cover: '/assets/projects/project-05/cover/placeholder.jpg', // [미디어첨부] 대표 이미지
    gallery: [               // [미디어첨부] 스틸컷 목록
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID
    fields: {                // [내용수정] 상세 본문
      overview:            { ko: '[Overview placeholder]', en: '[Overview placeholder]' },
      concept:             { ko: '[Concept placeholder]', en: '[Concept placeholder]' },
      systemFlow:          { ko: '[System Flow placeholder]', en: '[System Flow placeholder]' },
      systemArchitecture:  { ko: '[System Architecture placeholder]', en: '[System Architecture placeholder]' },
      process:             { ko: '[Process placeholder]', en: '[Process placeholder]' },
      experiment:          { ko: '[Experiment / Iteration placeholder]', en: '[Experiment / Iteration placeholder]' },
      result:             { ko: '[Result placeholder]', en: '[Result placeholder]' },
      learning: LEARNING_PLACEHOLDER(),
    },
  },

  // ── 프로젝트 06 ──────────────────────────────────────────────────────
  {
    id: 'project-06',
    slug: 'project-06',
    index: '06',             // [내용수정] 번호표
    year: '[YYYY]',          // [분류값]
    category: 'media-art',   // [분류값][검토]
    tools: ['Interactive Media / Real-time Visual'], // [내용수정] 사용 툴 태그
    role: { ko: '[Role placeholder]', en: '[Role placeholder]' }, // [내용수정]
    title: { ko: '[프로젝트명 placeholder]', en: '[Project title placeholder]' }, // [내용수정]
    subtitle: {              // [내용수정] 한 줄 설명
      ko: '공간 디자인 사고 기반 미디어아트 설치',
      en: 'Media Art Installation Rooted in Spatial Design Thinking',
    },
    nextProject: 'project-01', // [분류값] 마지막 → 첫 프로젝트로 순환
    cover: '/assets/projects/project-06/cover/placeholder.jpg', // [미디어첨부] 대표 이미지
    gallery: [               // [미디어첨부] 스틸컷 목록
      '/assets/projects/project-01/cover/still-01.jpg',
      '/assets/projects/project-01/cover/still-02.jpg',
    ],
    video: { youtubeId: '' }, // [미디어첨부] 유튜브 ID
    fields: {                // [내용수정] 상세 본문
      overview:            { ko: '[Overview placeholder]', en: '[Overview placeholder]' },
      concept:             { ko: '[Concept placeholder]', en: '[Concept placeholder]' },
      systemFlow:          { ko: '[System Flow placeholder]', en: '[System Flow placeholder]' },
      systemArchitecture:  { ko: '[System Architecture placeholder]', en: '[System Architecture placeholder]' },
      process:             { ko: '[Process placeholder]', en: '[Process placeholder]' },
      experiment:          { ko: '[Experiment / Iteration placeholder]', en: '[Experiment / Iteration placeholder]' },
      result:             { ko: '[Result placeholder]', en: '[Result placeholder]' },
      learning: LEARNING_PLACEHOLDER(),
    },
  },
]

// slug(URL) 로 프로젝트 하나를 찾아 반환 — 상세 페이지에서 사용. (수정 불필요)
export function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug)
}
