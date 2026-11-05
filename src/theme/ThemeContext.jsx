// 사이트 라이트 / 다크 모드 상태 — 상단바 버튼이 전환하고, 선택은 브라우저에 기억됩니다.
//  [기본값] 처음 방문자는 DEFAULT_THEME 로 시작 ('dark' | 'light')
//  [색상변경] 실제 색은 src/styles/tokens.css 의 :root(다크) / :root[data-theme='light'](라이트)
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export const DEFAULT_THEME = 'dark'
const STORAGE_KEY = 'portfolio-theme'

function readSaved() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readSaved() || DEFAULT_THEME)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* 저장 불가 환경은 무시 */ }
  }, [theme])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }),
    [theme],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// 사용 예: const { theme, toggleTheme } = useTheme()
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 는 ThemeProvider 내부에서만 사용 가능합니다.')
  return ctx
}
