# Portfolio v0

Media Artist / Technical Artist 포트폴리오 사이트 — 버전 0

`포트폴리오_웹_구축지침.txt`에 정의된 기준(디자인 톤: Dark/Purple, 구조: Home/Projects, 프로젝트 6단계 구성, KR/EN, 콘텐츠-코드 분리 등)을 그대로 구현한 초기 골격입니다.

## 1. 실행 방법 (VS Code)

```bash
npm install
npm run dev
```

실행 후 터미널에 뜨는 `http://localhost:5173` 주소를 브라우저에서 열면 됩니다.
VS Code를 쓴다면 통합 터미널(Ctrl+`)에서 위 명령어를 그대로 입력하면 되고, 별도 창을 열 필요는 없습니다.

## 2. 폴더 구조

```
portfolio-v0/
 ├─ src/
 │   ├─ components/     Header, Footer, Hero, ProjectCard 등 UI 조각
 │   ├─ pages/           Home, ProjectsList, ProjectDetail, About, Contact
 │   ├─ data/projects.js 프로젝트 콘텐츠 (Placeholder, 실제 내용으로 교체 예정)
 │   ├─ i18n/            KR/EN 텍스트와 언어 전환 로직
 │   └─ styles/          디자인 토큰(tokens.css) + 전역 스타일
 ├─ public/assets/projects/project-01~06/{cover,process,result}
 │       프로젝트별 이미지·영상 배치 폴더 (현재 비어있음, 실제 파일만 넣으면 반영됨)
 └─ vite.config.js       GitHub Pages 배포용 base 경로 설정
```

## 3. 콘텐츠 교체 방법 (코드 수정 불필요)

- **프로젝트 내용**: `src/data/projects.js`의 `[placeholder]` 문구를 실제 내용으로 교체
- **이미지/영상**: `public/assets/projects/project-XX/cover/` 등에 실제 파일을 넣고, `projects.js`의 `cover` 경로를 파일명에 맞게 수정
- **사이트 전역 문구(About/Contact 등)**: `src/i18n/strings.js` 수정
- 이미지가 아직 없는 프로젝트 카드는 자동으로 `NO_SIGNAL` 플레이스홀더가 표시됩니다.

## 4. GitHub Pages 배포

```bash
npm run deploy
```

배포 전 `vite.config.js`의 `base` 값을 실제 저장소 이름에 맞게 확인하세요.
예: 저장소 주소가 `github.com/아이디/portfolio` → `base: '/portfolio/'`

## 5. Figma 확인/연동 방법

React로 만든 실제 사이트 화면 자체를 Figma 안에서 그대로 띄워 볼 수는 없습니다 (Figma는 디자인 툴이라 라이브 웹앱을 렌더링하지 않습니다). 대신 아래 두 방향으로 연동합니다.

**A. 디자인 확인용 (Figma → 눈으로 확인)**
Figma에서 만든 시안은 Figma 앱/웹에서 그대로 확인하면 됩니다. 코드 구현 결과와 비교할 때는 Figma 화면과 `npm run dev`로 띄운 브라우저 화면을 나란히 두고 비교하는 방식이 일반적입니다.

**B. 자동화 연동용 (Figma ↔ VS Code/Claude Code, MCP)**
Figma는 "Dev Mode MCP 서버"를 제공하며, VS Code의 Claude Code가 이 서버에 연결되면 Figma 파일의 컴포넌트·컬러·변수·레이아웃 정보를 직접 읽어와 코드에 반영할 수 있습니다. 즉 "Figma 시안을 보고 손으로 옮겨 코딩"하는 대신, Claude Code가 Figma의 실제 디자인 값(색상 변수, 간격, 컴포넌트 구조)을 참조해 코드를 생성/수정하게 할 수 있습니다.

파이프라인 개요:
```
[Figma 시안 작업]
      ↓ (Dev Mode 전환 + MCP 서버 활성화)
[Figma Desktop 앱: Dev Mode MCP Server ON]
      ↓ (MCP 연결)
[VS Code + Claude Code]
      ↓ (선택한 프레임/컴포넌트의 디자인 데이터 읽기)
[React 컴포넌트 코드 생성/수정]
      ↓
[npm run dev 로 브라우저에서 즉시 확인]
```

연동 절차 요약 (0단계부터는 아래 답변 본문에 정리):
1. Figma 유료 플랜(Dev 또는 Full 시트) 필요 — 무료 플랜은 Dev Mode MCP 미지원
2. Figma Desktop 앱에서 해당 파일을 열고 Dev Mode 전환 후 MCP 서버 토글 ON
3. VS Code에서 Claude Code 실행 → `/plugin` 또는 MCP 설정에서 Figma 서버 연결
4. Figma에서 프레임/컴포넌트 선택 → Claude Code에 "이 프레임대로 구현해줘" 요청

## 6. 다음 단계

- Figma 디자인 시스템(컬러/타입/그리드) 확정 후 tokens.css 값 미세 조정
- 실제 프로젝트 6개 콘텐츠 및 에셋 채우기
- 반응형/접근성 세부 점검 (현재 v0는 Desktop/Tablet/Mobile 기본 대응만 포함)
