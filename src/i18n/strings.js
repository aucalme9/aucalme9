// ============================================================================
//  UI 전역 텍스트 - 코드와 분리된 데이터 소스
//  실제 배포 시 이 파일만 수정하면 UI 전체 문구가 교체됩니다.
//
//  [내용수정] 표시가 있는 값의 따옴표 안 텍스트만 바꾸면 됩니다.
//    - ko: 한국어 문구 / en: 영어 문구 (KR·EN 토글에 각각 대응)
//    - 키 이름(예: label, body)이나 중괄호 구조는 건드리지 마세요.
//    - \n 은 줄바꿈입니다. (Hero 타이틀에서 사용)
// ============================================================================
export const strings = {
  // ── 상단 내비게이션 메뉴 라벨 [내용수정] ──────────────────────────────
  //    메뉴 이름을 바꾸려면 아래 텍스트만 수정. (경로/라우팅은 App.jsx에서 관리)
  nav: {
    home: { ko: 'Home', en: 'Home' },
    projects: { ko: 'Projects', en: 'Projects' },
    about: { ko: 'About', en: 'About' },
    contact: { ko: 'Contact', en: 'Contact' },
  },

  // ── 홈 상단 히어로 영역 [내용수정] ───────────────────────────────────
  hero: {
    // 직함/역할 라벨 (작은 대문자 라인)
    eyebrow: { ko: 'MEDIA ARTIST / TECHNICAL ARTIST', en: 'MEDIA ARTIST / TECHNICAL ARTIST' },
    // 메인 카피 [내용수정] — \n 위치에서 줄이 나뉩니다. 줄 수는 자유롭게 조절 가능.
    title: {
      ko: '공간을 감각하고,\n시스템으로 구현한다.',
      en: 'Sensing space,\nimplemented as system.',
    },
    // 히어로 하단 설명 문단 [내용수정]
    description: {
      ko: 'Interior Design 기반의 공간적 사고를 바탕으로 Media Art와 기술 구현을 연결합니다.',
      en: 'Connecting media art and technical implementation, grounded in a spatial way of thinking from an interior design background.',
    },
  },

  // ── 프로젝트 상세 헤더의 메타 라벨 [내용수정] (값은 projects.js 의 year / category) ──
  projectMeta: {
    yearLabel: { ko: 'YEAR', en: 'YEAR' },
    categoryLabel: { ko: 'CATEGORY', en: 'CATEGORY' },
  },

  // ── About 'CURRENTLY LEARNING' 섹션 항목 [내용수정] ──────────────────
  evolution: {
    exploring: ['Houdini', 'Unreal Engine'],
  },

  // ── Projects 목록 페이지: 필터 카테고리 [내용수정] ───────────────────
  //    key 는 projects.js 의 category 값과 일치해야 함. 'all' 은 전체 표시.
  filters: {
    all: { ko: 'ALL', en: 'ALL' },
    'media-art': { ko: 'MEDIA ART', en: 'MEDIA ART' },
    generative: { ko: 'GENERATIVE', en: 'GENERATIVE' },
    interactive: { ko: 'INTERACTIVE', en: 'INTERACTIVE' },
    '3d': { ko: '3D', en: '3D' },
    'audio-reactive': { ko: 'AUDIO REACTIVE', en: 'AUDIO REACTIVE' },
    experiment: { ko: 'EXPERIMENT', en: 'EXPERIMENT' },
    other: { ko: 'OTHER', en: 'OTHER' },
  },

  // ── About 페이지 [내용수정] ─────────────────────────────────────────
  about: {
    label: { ko: 'ABOUT', en: 'ABOUT' },
    // 자기소개 본문 [내용수정]
    body: {
      ko: '[About 소개 문구 — 여기에 본인 소개를 직접 작성하세요]',
      en: '[About statement — write your own introduction here]',
    },
    // 6블록 구조 섹션 제목 [내용수정]
    profileLabel: { ko: 'PROFILE', en: 'PROFILE' },
    backgroundLabel: { ko: 'BACKGROUND', en: 'BACKGROUND' },
    approachLabel: { ko: 'APPROACH', en: 'APPROACH' },
    skillsLabel: { ko: 'SKILLS', en: 'SKILLS' },
    currentlyLearningLabel: { ko: 'CURRENTLY LEARNING', en: 'CURRENTLY LEARNING' },
    workflowLabel: { ko: 'WORKFLOW', en: 'WORKFLOW' },
    // BACKGROUND / APPROACH 본문 [내용수정]
    background: {
      ko: '[Background — Interior Design 기반의 공간적 사고에서 출발한 경로 placeholder]',
      en: '[Background — the path from a spatial way of thinking rooted in interior design placeholder]',
    },
    approach: {
      ko: '[Approach — 공간적 사고가 디지털·인터랙티브·실시간 경험으로 확장되는 방식 placeholder]',
      en: '[Approach — how spatial thinking evolves into digital, interactive and real-time experiences placeholder]',
    },
    // SKILLS — 역할별 그룹 (숙련도 % 표기 없음) [내용수정]
    skillGroups: [
      { label: { ko: 'DESIGN', en: 'DESIGN' }, items: ['Spatial Design', 'Visual Composition', 'Spatial Experience'] },
      { label: { ko: '3D / VISUAL', en: '3D / VISUAL' }, items: ['Blender', '3D Modeling', 'Visual Development'] },
      { label: { ko: 'REAL-TIME', en: 'REAL-TIME' }, items: ['TouchDesigner', 'Generative Visual', 'Audio Reactive'] },
      { label: { ko: 'EXPLORING', en: 'EXPLORING' }, items: ['Houdini', 'Unreal Engine'] },
    ],
    // WORKFLOW — 작업 흐름 단계 [내용수정]
    workflow: ['IDEA', 'RESEARCH', 'DESIGN', '3D / VISUAL', 'REAL-TIME SYSTEM', 'TEST', 'ITERATION', 'RESULT'],
  },

  // ── Contact 페이지 [내용수정] ────────────────────────────────────────
  contact: {
    label: { ko: 'CONTACT', en: 'CONTACT' },
    // 연락 안내 문단 [내용수정]
    body: {
      ko: '협업 및 채용 문의는 아래 채널로 연락 주세요.',
      en: 'For collaboration or hiring inquiries, please reach out via the channels below.',
    },
    // 실제 이메일 주소로 교체 [내용수정] — 화면 표시 + 메일 링크(mailto)에 함께 쓰입니다.
    email: 'placeholder@example.com',
    // SOCIAL / PORTFOLIO·VIDEO 링크 [내용수정][연락처 추가]
    //  label = 화면 표시 텍스트, href = 실제 주소. 줄을 추가/삭제하면 목록이 늘거나 줄어듭니다.
    linksLabel: { ko: 'ELSEWHERE', en: 'ELSEWHERE' },
    links: [
      { label: 'Instagram', href: '[https://instagram.com/ placeholder]' },
      { label: 'Vimeo / YouTube', href: '[video channel URL placeholder]' },
      { label: 'Portfolio PDF', href: '[portfolio PDF URL placeholder]' },
    ],
  },

  // ── 프로젝트 상세 페이지의 섹션 제목 (10단계) [내용수정] ─────────────
  //    각 프로젝트 본문 내용은 여기가 아니라 src/data/projects.js 에서 입력합니다.
  project: {
    overview: { ko: 'Overview', en: 'Overview' },
    concept: { ko: 'Concept', en: 'Concept' },
    systemFlow: { ko: 'System Flow', en: 'System Flow' },
    systemArchitecture: { ko: 'System Architecture', en: 'System Architecture' },
    process: { ko: 'Process', en: 'Process' },
    experiment: { ko: 'Experiment / Iteration', en: 'Experiment / Iteration' },
    result: { ko: 'Result', en: 'Result' },
    role: { ko: 'Role', en: 'Role' },
    tools: { ko: 'Tools', en: 'Tools' },
    learning: { ko: 'Learning', en: 'Learning' },
    // 10 LEARNING 하위 4항목 라벨
    learningLearned: { ko: 'What I learned', en: 'What I learned' },
    learningDidntWork: { ko: "What didn't work", en: "What didn't work" },
    learningChanged: { ko: 'What I changed', en: 'What I changed' },
    learningNext: { ko: 'Next step', en: 'Next step' },
    // 상세 하단 "다음 프로젝트" 연결 블록
    nextProject: { ko: 'NEXT PROJECT', en: 'NEXT PROJECT' },
    back: { ko: '← Projects', en: '← Projects' },
  },

  // ── 페이지 하단 푸터 문구 [내용수정] (연도는 자동 계산) ──────────────
  footer: {
    rights: { ko: '개인 포트폴리오 사이트', en: 'Personal Portfolio Site' },
  },
}
