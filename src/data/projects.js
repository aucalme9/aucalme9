// ============================================================================
//  프로젝트 데이터 - UI 코드와 완전히 분리
//  이 파일의 값만 교체하면 목록/상세 페이지 전체에 자동 반영됩니다.
//
//  ── 무엇을 어디서 바꾸나 ──────────────────────────────────────────────
//   [내용수정]   title / subtitle / categoryLabel / fields.* 의 따옴표 안 텍스트 (ko·en 각각)
//   [분류값]     categories(필터 키 배열) / year / nextProject(다음 프로젝트 slug)
//   [미디어첨부] cover / gallery[] / video.youtubeId / mapping.media 의 경로·ID 값
//   [항목 추가]  { ... } 블록을 통째로 복사해 배열에 붙이면 프로젝트가 늘어납니다.
//                (id·slug 는 서로 겹치지 않게, index 는 화면 표시용 번호)
//   * year / role 처럼 비워둔('') 값은 화면에서 자동으로 숨겨집니다.
//
//  ── categories (목록 페이지 필터) [분류값] ──────────────────────────
//     아래 CATEGORY_KEYS 중에서 1개 이상. 여러 개 넣으면 각 필터에 모두 표시됩니다.
//     (필터 버튼 라벨은 src/i18n/strings.js → filters.*)
//     categoryLabel 은 화면에 보이는 카테고리 문구(자유 텍스트)입니다.
//
//  ── 상세 페이지 본문 (src/pages/ProjectDetail.jsx 가 이 순서로 렌더) ──
//     번호는 실제로 표시되는 섹션만 세서 자동으로 매겨집니다.
//       OVERVIEW          fields.overview        핵심 내용
//       KEY WORK          fields.keyWork[]       주요 작업 (한 줄씩)
//       KEY EXPERIMENTS   fields.experiments[]   주요 실험 ({ name, ko, en })
//       SYSTEM STRUCTURE  fields.structure[]     구현 구조 (단계 이름 배열 → 노드그래프에도 반영)
//       ── 노드 그래프 ──
//       TOOLS             tools[]
//     ※ 아래 항목은 넣으면 TOOLS 앞에 자동으로 추가 표시됩니다 (선택):
//       fields.concept / fields.process / fields.result  ({ ko, en })
//       role ({ ko, en })  /  fields.learning ({ learned, didntWork, changed, next })
//
//  ── 이미지 / 영상 파일 넣는 위치 [미디어첨부] ────────────────────────
//   경로 규칙:  /assets/projects/project-XX/{cover|process|result}/파일명
//   실제 파일은  public/assets/projects/project-XX/... 폴더에 저장하세요.
//     - cover          : 카드 썸네일용 대표 이미지 1장
//     - gallery[]      : 상세 페이지 스틸컷 슬라이드 (여러 장, 순서대로 표시)
//     - video.youtubeId: 유튜브 '보기' URL 의  v=  뒤 11자리 값만  (예: 'dQw4w9WgXcQ')
//     - mapping.media  : 상단 3D 맵핑 미리보기에 씌울 mp4/webm/jpg (아래 MAPPING 설명)
//   * 파일이 없거나 경로가 틀리면 자동으로 NO_SIGNAL 플레이스홀더로 대체됩니다.
// ============================================================================

// 목록 페이지 필터 순서 ('all' = 전체). 라벨은 strings.js → filters.*
export const CATEGORY_KEYS = ['all', 'point-cloud', 'audio-reactive', 'exhibition', 'award', 'client', 'experiment']

// 상세 상단 '맵핑 미리보기' 데이터 (3D 뷰어 + 하단 카드)
//  [미디어첨부] media : 3D 표면에 씌울 영상/이미지 경로. 비우면 제너레이티브 테스트 패턴 재생.
//               예) '/assets/projects/project-01/result/mapping.mp4'  (가로 2:1 비율 권장, 음소거 자동재생)
//               ※ 유튜브 링크는 3D 표면에 씌울 수 없음 → mp4/webm/jpg/png 파일로.
//  [분류값]     modes : 보여줄 표면과 순서. 'split'(분할) / 'dome'(반구형) / 'walls'(3면 벽). 첫 번째가 기본 탭.
//  [내용수정]   specs.<mode> : 카드에 표시되는 실제 스펙 값 (지금은 예시값 placeholder)
const MAPPING = (modes = ['split', 'dome', 'walls'], overrides = {}) => ({
  media: '',
  modes,
  specs: {
    split: { resolution: '[7680 × 2160]', pitch: '[P2.6]', fps: '[60 fps]', outputs: '[10]', chain: '[TouchDesigner → Media Server → LED Processor]' },
    dome:  { resolution: '[16384 × 8192]', pitch: '[P3.9]', fps: '[60 fps]', outputs: '[16]', chain: '[TouchDesigner → Equirect Render → Node Cluster]' },
    walls: { resolution: '[11520 × 1728]', pitch: '[3× 20K lm]', fps: '[30 fps]', outputs: '[3]', chain: '[TouchDesigner → Warp / Blend → 3× Projector]' },
  },
  ...overrides,
})

// 한 줄 텍스트 (ko/en) 줄임 헬퍼
const t = (ko, en) => ({ ko, en })

export const projects = [
  // ┌─────────────────────────────────────────────────────────────────────┐
  // │ 01 — STRANGE WORLD  (아래 블록이 다른 프로젝트의 작성 템플릿입니다)  │
  // └─────────────────────────────────────────────────────────────────────┘
  {
    id: 'strange-world',     // 내부 식별자 (겹치지 않게). 보통 slug 와 동일
    slug: 'strange-world',   // URL 주소: /projects/strange-world  ← 영문 소문자·숫자·하이픈만
    index: '01',             // [내용수정] 화면에 보이는 번호표 (P.01)
    year: '',                // [분류값] 제작 연도 (비우면 숨김)
    categories: ['point-cloud'],                                // [분류값] 필터 키
    categoryLabel: t('Point Cloud / 3D Visualization', 'Point Cloud / 3D Visualization'), // [내용수정] 표시용 카테고리
    tools: ['TouchDesigner', 'Blender'],                        // [내용수정] 사용 툴 태그
    role: t('', ''),                                            // [내용수정] 본인 역할 (비우면 숨김)
    title: t('STRANGE WORLD', 'STRANGE WORLD'),
    subtitle: t('드론·LiDAR 데이터 기반 3D 공간 재구성', '3D spatial reconstruction from drone & LiDAR data'),
    nextProject: 'audio-reacting', // [분류값] 상세 하단 "다음 프로젝트" (slug). 없으면 ''
    cover: '/assets/projects/project-01/cover/cover.jpg', // [미디어첨부]
    gallery: [],                                          // [미디어첨부] 예) '/assets/projects/project-01/result/still-01.jpg'
    video: { youtubeId: '' },                             // [미디어첨부]
    mapping: MAPPING(['dome', 'walls', 'split']),          // [미디어첨부][내용수정] 상단 맵핑 미리보기
    fields: {
      overview: t(
        '드론 및 LiDAR 데이터를 활용한 3D 공간 재구성 프로젝트.',
        'A 3D spatial reconstruction project using drone and LiDAR data.',
      ),
      keyWork: [
        t('드론 촬영 및 LiDAR 데이터 활용', 'Drone capture and LiDAR data acquisition'),
        t('PLY 데이터 기반 Point Cloud 구현', 'Point cloud built from PLY data'),
        t('실제 공간의 비정형적인 형태와 지형 시각화', 'Visualizing the irregular forms and terrain of a real site'),
        t('반 고흐의 풍경화에서 영감을 얻은 공간 및 시점 표현', "Space and viewpoint inspired by Van Gogh's landscape paintings"),
      ],
    },
  },

  // ── 02 — AUDIO REACTING ─────────────────────────────────────────────
  {
    id: 'audio-reacting',
    slug: 'audio-reacting',
    index: '02',
    year: '',
    categories: ['audio-reactive'],
    categoryLabel: t('Audio Reactive / Generative Visual', 'Audio Reactive / Generative Visual'),
    tools: ['TouchDesigner', '3D Scanning'],
    role: t('', ''),
    title: t('AUDIO REACTING', 'AUDIO REACTING'),
    subtitle: t('3D 스캔 오브젝트 × 음악 주파수 데이터', '3D-scanned object × music frequency data'),
    nextProject: 'point-cloud-audio',
    cover: '/assets/projects/project-02/cover/cover.jpg',
    gallery: [],
    video: { youtubeId: '' },
    mapping: MAPPING(['split', 'dome', 'walls']),
    fields: {
      overview: t(
        '3D 스캔 오브젝트와 음악의 주파수 데이터를 결합한 오디오 반응형 비주얼.',
        'An audio-reactive visual combining a 3D-scanned object with the frequency data of music.',
      ),
      keyWork: [
        t('꽃 오브젝트 3D Scan', '3D scan of a flower object'),
        t('High / Mid / Low 주파수 분리 및 분석', 'Splitting and analyzing High / Mid / Low frequency bands'),
        t('오디오 데이터에 따른 오브젝트 및 시각 요소 변화', 'Object and visual elements driven by audio data'),
        t('음악의 특성을 시각적인 움직임으로 변환', 'Translating the character of music into visual motion'),
      ],
    },
  },

  // ── 03 — POINT CLOUD × AUDIO ────────────────────────────────────────
  {
    id: 'point-cloud-audio',
    slug: 'point-cloud-audio',
    index: '03',
    year: '',
    categories: ['point-cloud', 'audio-reactive'],
    categoryLabel: t('Point Cloud / Audio Reactive', 'Point Cloud / Audio Reactive'),
    tools: ['TouchDesigner'],
    role: t('', ''),
    title: t('POINT CLOUD × AUDIO', 'POINT CLOUD × AUDIO'),
    subtitle: t('Point Cloud × 오디오 반응 실시간 시각화', 'Real-time point cloud × audio-reactive visualization'),
    nextProject: 'graduation-exhibition',
    cover: '/assets/projects/project-03/cover/cover.jpg',
    gallery: [],
    video: { youtubeId: '' },
    mapping: MAPPING(['dome', 'split', 'walls']),
    fields: {
      overview: t(
        'Point Cloud 데이터와 오디오 반응 시스템을 결합한 실시간 시각화 프로젝트.',
        'A real-time visualization project combining point cloud data with an audio-reactive system.',
      ),
      keyWork: [
        t('PLY 기반 Point Cloud 데이터 활용', 'Working with PLY-based point cloud data'),
        t('공간 데이터의 시각적 변환', 'Visual transformation of spatial data'),
        t('Audio Analysis 및 주파수 데이터 연동', 'Audio analysis and frequency data linkage'),
        t('사운드에 반응하는 Point Cloud 시각화', 'Point cloud visualization that responds to sound'),
      ],
    },
  },

  // ── 04 — GRADUATION EXHIBITION ──────────────────────────────────────
  {
    id: 'graduation-exhibition',
    slug: 'graduation-exhibition',
    index: '04',
    year: '',
    categories: ['exhibition'],
    categoryLabel: t('Exhibition Visual / Motion Graphics', 'Exhibition Visual / Motion Graphics'),
    tools: ['Blender', 'TouchDesigner', 'Video Editing'],
    role: t('', ''),
    title: t('GRADUATION EXHIBITION', 'GRADUATION EXHIBITION'),
    subtitle: t('졸업전시 영상 및 공간 기반 비주얼 콘텐츠', 'Video and spatial visual content for a graduation exhibition'),
    nextProject: 'award-project',
    cover: '/assets/projects/project-04/cover/cover.jpg',
    gallery: [],
    video: { youtubeId: '' },
    mapping: MAPPING(['walls', 'split', 'dome']),
    fields: {
      overview: t(
        '졸업전시를 위한 영상 및 공간 기반 비주얼 콘텐츠 제작.',
        'Producing video and space-based visual content for a graduation exhibition.',
      ),
      keyWork: [
        t('졸업전시 영상 기획 및 제작', 'Planning and producing the exhibition video'),
        t('전시 환경에 적합한 영상 구성', 'Composing the video to suit the exhibition environment'),
        t('공간과 영상의 시각적 관계 고려', 'Considering the visual relationship between space and image'),
        t('최종 전시 콘텐츠 구현', 'Delivering the final exhibition content'),
      ],
    },
  },

  // ── 05 — AWARD PROJECT ──────────────────────────────────────────────
  {
    id: 'award-project',
    slug: 'award-project',
    index: '05',
    year: '',
    categories: ['award'],
    categoryLabel: t('Competition / Award', 'Competition / Award'),
    tools: ['[Tools TBD]'], // [내용수정] 실제 사용 도구에 따라 기재
    role: t('', ''),
    title: t('AWARD PROJECT', 'AWARD PROJECT'),
    subtitle: t('공모전 출품 및 수상 프로젝트', 'Competition entry and award-winning project'),
    nextProject: 'outsourcing-project',
    cover: '/assets/projects/project-05/cover/cover.jpg',
    gallery: [],
    video: { youtubeId: '' },
    mapping: MAPPING(['split', 'walls', 'dome']),
    fields: {
      overview: t('공모전 출품 및 수상 프로젝트.', 'A project entered in a competition and awarded.'),
      keyWork: [
        t('공모전 주제 분석 및 아이디어 구체화', 'Analyzing the competition brief and developing the idea'),
        t('시각적 콘셉트 및 결과물 제작', 'Creating the visual concept and final work'),
        t('출품 및 수상', 'Submission and award'),
      ],
    },
  },

  // ── 06 — OUTSOURCING PROJECT ────────────────────────────────────────
  {
    id: 'outsourcing-project',
    slug: 'outsourcing-project',
    index: '06',
    year: '',
    categories: ['client'],
    categoryLabel: t('Client Work / Commercial Visual', 'Client Work / Commercial Visual'),
    tools: ['TouchDesigner', 'Blender', 'Video Editing'],
    role: t('', ''),
    title: t('OUTSOURCING PROJECT', 'OUTSOURCING PROJECT'),
    subtitle: t('외부 의뢰 영상 및 비주얼 제작', 'Commissioned video and visual production'),
    nextProject: 'experiment-lab',
    cover: '/assets/projects/project-06/cover/cover.jpg',
    gallery: [],
    video: { youtubeId: '' },
    mapping: MAPPING(['split', 'walls', 'dome']),
    fields: {
      overview: t(
        '외부 의뢰를 받아 수행한 영상 및 비주얼 제작 프로젝트.',
        'A video and visual production project commissioned by an external client.',
      ),
      keyWork: [
        t('클라이언트 요구사항 분석', 'Analyzing client requirements'),
        t('프로젝트 콘셉트 및 시각 방향 설정', 'Setting the project concept and visual direction'),
        t('의뢰 목적에 맞는 영상 콘텐츠 제작', 'Producing video content that fits the brief'),
        t('결과물 납품', 'Final delivery'),
      ],
    },
  },

  // ── 07 — EXPERIMENT LAB ─────────────────────────────────────────────
  {
    id: 'experiment-lab',
    slug: 'experiment-lab',
    index: '07',
    year: '',
    categories: ['experiment'],
    categoryLabel: t('Technical Experiment / Interactive System', 'Technical Experiment / Interactive System'),
    tools: ['TouchDesigner', 'MIDI', 'OSC', 'Kinect'],
    role: t('', ''),
    title: t('EXPERIMENT LAB', 'EXPERIMENT LAB'),
    subtitle: t('입력 장치 × 데이터 통신 인터랙티브 비주얼 실험', 'Interactive visual experiments with input devices and data communication'),
    nextProject: 'strange-world', // 마지막 → 첫 프로젝트로 순환
    cover: '/assets/projects/project-07/cover/cover.jpg',
    gallery: [],
    video: { youtubeId: '' },
    mapping: MAPPING(['walls', 'split', 'dome']),
    fields: {
      overview: t(
        '다양한 입력 장치와 데이터 통신 방식을 활용한 인터랙티브 비주얼 실험.',
        'Interactive visual experiments using a range of input devices and data communication methods.',
      ),
      experiments: [
        { name: 'MIDI Controller', ...t('물리적 컨트롤러를 이용한 파라미터 제어', 'Controlling parameters with a physical controller') },
        { name: 'OSC Communication', ...t('외부 프로그램과 TouchDesigner 간 데이터 통신', 'Data communication between external programs and TouchDesigner') },
        { name: 'Kinect Interaction', ...t('신체 및 움직임 기반 인터랙션', 'Body- and motion-based interaction') },
        { name: 'Optical Flow', ...t('영상 내 움직임 데이터 추출 및 활용', 'Extracting and using motion data from video') },
        { name: '3D Texture', ...t('3차원 텍스처 데이터 활용 및 시각화', 'Using and visualizing 3D texture data') },
      ],
      structure: ['Input Device / Data', 'Input Processing', 'Parameter Mapping', 'Visual Output'],
    },
  },
]

// slug(URL) 로 프로젝트 하나를 찾아 반환 — 상세 페이지에서 사용. (수정 불필요)
export function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug)
}

// 필터 키에 해당하는지 ('all' 이면 항상 true) (수정 불필요)
export function inCategory(project, key) {
  return key === 'all' || (project.categories || []).includes(key)
}

// 카드·팝업용 메타 한 줄: YEAR · CATEGORY · ROLE (빈 값은 건너뜀) (수정 불필요)
export function metaLine(project, lang, { tools = false } = {}) {
  return [
    project.year,
    project.categoryLabel?.[lang],
    tools ? project.tools.join(', ') : '',
    project.role?.[lang],
  ]
    .filter(Boolean)
    .join(' · ')
}
