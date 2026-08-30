// ═══════════════════════════════════════════════════════════════════════════
//  섹션(블럭) 레이아웃 공용 헬퍼  ─  각 페이지 BLOCKS 설정을 인라인 style 로 변환.
//  이 파일은 수정할 필요 없습니다. 값은 각 페이지 상단 BLOCKS 에서 조절.
//
//  ※ 수치 항목은 아래를 모두 허용 (따옴표 있어도 됨):
//       5  또는 '5'                → 5rem(여백류) / 5px(높이·폭류)
//       '48px' '2rem' '10%' '80vh' → 단위 그대로
//       'auto' 또는 ''             → 공통(기본)값 사용
//
//  BLOCKS 한 블럭의 항목
//    order     : 표시 순서. 숫자가 작을수록 위. (보이는 순서만 바꿈, 탭 순서는 코드순)
//    minHeight : 섹션 최소 높이. 600→600px / '80vh'→화면 80% / 0→내용 높이.
//                내용이 더 크면 자동으로 늘어납니다.
//    align     : minHeight 로 늘린 여유 안에서 내용 위치. 'top'(기본)/'center'/'bottom'.
//    padTop/padBottom   : 블럭 안쪽 위/아래 여백(rem). 블럭마다 독립(서로 안 합쳐짐).
//    padLeft/padRight   : 이 블럭만의 좌/우 여백(rem). 'auto'=공통값(tokens.css --page-gutter).
//                         ※ maxWidth 로 폭이 제한된 블럭은 화면이 넓을수록 좌/우 변화가
//                           덜 보입니다. 확실히 하려면 maxWidth:'none' 과 함께.
//    maxWidth  : 콘텐츠 최대 가로 폭. 'auto'=공통(--page-max, 1280px) / 1600=1600px /
//                'none'('full')=제한 없음(모니터 가로 꽉 채움).
//                화면 끝까지 붙이려면 maxWidth:'none' + padLeft:0 + padRight:0.
// ═══════════════════════════════════════════════════════════════════════════

// 값을 CSS 길이 문자열로 정규화. 숫자/'숫자'는 defaultUnit 을 붙이고,
// 단위가 이미 붙은 문자열은 그대로, 'auto'/'' 는 null(= 지정 안 함).
function toLen(v, defaultUnit) {
  if (typeof v === 'number') return Number.isFinite(v) ? `${v}${defaultUnit}` : null
  if (typeof v === 'string') {
    const s = v.trim()
    if (s === '' || s === 'auto') return null
    return /^-?\d*\.?\d+$/.test(s) ? `${s}${defaultUnit}` : s
  }
  return null
}

const ALIGN = { top: 'flex-start', center: 'center', bottom: 'flex-end' }

export function blockStyle(cfg = {}) {
  const {
    order,
    minHeight = 0,
    padTop = 0,
    padBottom = 0,
    padLeft = 'auto',
    padRight = 'auto',
    maxWidth = 'auto',
    align = 'top',
  } = cfg

  const mh = toLen(minHeight, 'px')
  const style = {
    order,
    minHeight: mh && mh !== '0px' ? mh : undefined,
    paddingTop: toLen(padTop, 'rem') || '0rem',
    paddingBottom: toLen(padBottom, 'rem') || '0rem',
  }

  // 좌/우·최대폭·세로정렬은 CSS 변수로 전달 → 블럭 CSS 가 사용. 값이 없으면 공통값 유지.
  const pl = toLen(padLeft, 'rem')
  const pr = toLen(padRight, 'rem')
  if (pl != null) style['--block-pad-left'] = pl
  if (pr != null) style['--block-pad-right'] = pr

  if (maxWidth === 'none' || maxWidth === 'full') {
    style['--block-max-width'] = 'none'
  } else {
    const mw = toLen(maxWidth, 'px')
    if (mw != null) style['--block-max-width'] = mw
  }

  if (align && align !== 'top') style['--block-align'] = ALIGN[align] || 'flex-start'

  return style
}
