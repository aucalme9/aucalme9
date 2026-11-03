// public/ 폴더 파일 경로에 배포 base('/aucalme9/')를 붙여주는 헬퍼. (수정 불필요)
//  projects.js 에는 지금처럼 '/assets/...' 로 적으면 되고, 화면에 쓸 때 이 함수를 거칩니다.
//  http(s):// 로 시작하는 외부 주소나 빈 값은 그대로 돌려줍니다.
export function asset(path) {
  if (!path || typeof path !== 'string') return path
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path
  const base = import.meta.env.BASE_URL || '/'
  return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
}
