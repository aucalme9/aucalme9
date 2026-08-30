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

  // ── "FEATURED PROJECTS" 섹션 제목 [내용수정] ─────────────────────────
  featured: {
    label: { ko: 'FEATURED PROJECTS', en: 'FEATURED PROJECTS' },
  },

  // ── About 페이지 + 홈 하단 About 티저 [내용수정] ─────────────────────
  about: {
    label: { ko: 'ABOUT', en: 'ABOUT' },
    // 자기소개 본문 [내용수정] — 홈 티저와 About 페이지가 이 값을 공유합니다.
    body: {
      ko: '[About 소개 문구 — 여기에 본인 소개를 직접 작성하세요]',
      en: '[About statement — write your own introduction here]',
    },
    // 스킬 목록 두 그룹의 제목 [내용수정]
    coreSkillsLabel: { ko: 'CORE', en: 'CORE' },
    learningSkillsLabel: { ko: 'LEARNING', en: 'LEARNING' },
    // 스킬 항목 [내용수정] — 배열에 문자열을 추가/삭제하면 목록이 늘거나 줄어듭니다.
    coreSkills: ['TouchDesigner', 'Blender', 'AI / Generative Workflow', 'Interactive Media / Real-time Visual'],
    learningSkills: ['Houdini', 'Unreal Engine'],
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
  },

  // ── 프로젝트 상세 페이지의 섹션 제목 [내용수정] ─────────────────────
  //    각 프로젝트 본문 내용은 여기가 아니라 src/data/projects.js 에서 입력합니다.
  project: {
    overview: { ko: 'Overview', en: 'Overview' },
    concept: { ko: 'Concept', en: 'Concept' },
    process: { ko: 'Process', en: 'Process' },
    technical: { ko: 'Technical / System', en: 'Technical / System' },
    result: { ko: 'Result', en: 'Result' },
    role: { ko: 'Role', en: 'Role' },
    back: { ko: '← Projects', en: '← Projects' },
  },

  // ── 페이지 하단 푸터 문구 [내용수정] (연도는 자동 계산) ──────────────
  footer: {
    rights: { ko: '개인 포트폴리오 사이트', en: 'Personal Portfolio Site' },
  },
}
