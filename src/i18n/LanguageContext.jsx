import { createContext, useContext, useState, useMemo } from 'react'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('ko') // 'ko' | 'en'

  const value = useMemo(
    () => ({
      lang,
      toggleLang: () => setLang((prev) => (prev === 'ko' ? 'en' : 'ko')),
      setLang,
    }),
    [lang]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// 사용 예: const { lang } = useLanguage(); const text = field[lang]
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage는 LanguageProvider 내부에서만 사용 가능합니다.')
  return ctx
}
