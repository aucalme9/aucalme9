import { NavLink } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import { useTheme } from '../theme/ThemeContext'
import './Header.css'

export default function Header() {
  const { lang, toggleLang } = useLanguage()
  const { theme, toggleTheme } = useTheme()

  // ── 메뉴 항목 목록 ───────────────────────────────────────────────────
  //  [메뉴 추가/삭제] 이 배열에서 줄을 추가·삭제 (to = 이동 경로, label = 표시 텍스트)
  //  [메뉴 이름 변경] 텍스트는 여기가 아니라 src/i18n/strings.js 의 nav.* 에서 수정
  //  ※ 경로(to)를 바꾸면 src/App.jsx 의 <Route path> 도 같이 맞춰야 함
  const navItems = [
    { to: '/', label: strings.nav.home },
    { to: '/projects', label: strings.nav.projects },
    { to: '/about', label: strings.nav.about },
    { to: '/contact', label: strings.nav.contact },
  ]

  return (
    <header className="site-header">
      {/* [레이아웃조정] 상단바 높이·배경·정렬은 src/components/Header.css → .site-header / .site-header__inner */}
      <div className="container site-header__inner">
        {/* [내용수정] 좌측 로고 텍스트 — 원하는 문구로 변경 (예: 본인 이름/스튜디오명) */}
        <NavLink to="/" className="site-header__logo sys-label">
          PORTFOLIO / 001
        </NavLink>

        <nav className="site-header__nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    'site-header__link' + (isActive ? ' is-active' : '')
                  }
                >
                  {item.label[lang]}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* 우측 버튼 묶음: 라이트/다크 + 한/영 */}
        <div className="site-header__actions">
        {/* 라이트/다크 모드 전환 — 버튼에는 '지금 모드'를 표시. 문구는 strings.js → theme.* */}
        <button
          type="button"
          className="site-header__theme sys-label"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? strings.theme.toLight[lang] : strings.theme.toDark[lang]}
          aria-pressed={theme === 'light'}
        >
          <span className="site-header__theme-icon" aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
          <span className="site-header__theme-text">{strings.theme[theme][lang]}</span>
        </button>

        {/* 한/영 전환 버튼. [내용수정] 버튼에 보이는 라벨 텍스트만 아래에서 변경 가능.
            [레이아웃조정] 위치·색은 Header.css → .site-header__lang */}
        <button
          type="button"
          className="site-header__lang sys-label"
          onClick={toggleLang}
          aria-label="Toggle language"
        >
          {lang === 'ko' ? 'KR / EN' : 'EN / KR'}
        </button>
        </div>
      </div>
    </header>
  )
}
