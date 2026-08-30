import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import './Footer.css'

export default function Footer() {
  const { lang } = useLanguage()
  const year = new Date().getFullYear() // 올해 연도 자동 표기 (수정 불필요)

  return (
    // [레이아웃조정] 푸터 높이·상단 여백은 src/components/Footer.css → .site-footer / .site-footer__inner
    <footer className="site-footer">
      <div className="container site-footer__inner">
        {/* [내용수정] 좌측 문구는 strings.js → footer.rights */}
        <span className="sys-label">{strings.footer.rights[lang]}</span>
        {/* [내용수정] 우측 저작권 표기. 연도 앞뒤 텍스트를 여기서 바꿀 수 있음 */}
        <span className="sys-label">© {year}</span>
      </div>
    </footer>
  )
}
