import { useLanguage } from '../i18n/LanguageContext'
import { strings } from '../i18n/strings'
import { blockStyle } from '../utils/layout'
import './Contact.css'

// 섹션(블럭) 레이아웃 설정 — Contact  (항목별 설명은 src/utils/layout.js 참고)
//  블럭 1개. CSS 의 min-height: 40vh 가 별도 하한으로 함께 적용됨.
const BLOCKS = {
  main: { order: 1, minHeight: 0, padTop: 4, padBottom: 9 },
}

export default function Contact() {
  const { lang } = useLanguage()

  return (
    <div className="page-blocks">
      {/* 블럭: 연락처 (순서·상하여백·높이는 BLOCKS.main) */}
      <section className="contact" style={blockStyle(BLOCKS.main)}>
        <div className="container">
          {/* [내용수정] 제목·안내 문단은 strings.js → contact.label / contact.body */}
          <h1 className="sys-label contact__label">{strings.contact.label[lang]}</h1>
          <p className="contact__body">{strings.contact.body[lang]}</p>
          {/* [내용수정] 이메일 주소는 strings.js → contact.email (화면 표시 + mailto 링크에 함께 사용) */}
          <a className="contact__email" href={`mailto:${strings.contact.email}`}>
            {strings.contact.email}
          </a>

          {/* SOCIAL / PORTFOLIO·VIDEO 링크 — 항목·주소는 strings.js → contact.links[] */}
          <h2 className="sys-label contact__links-label">{strings.contact.linksLabel[lang]}</h2>
          <ul className="contact__links">
            {strings.contact.links.map((l) => (
              <li key={l.label}>
                <a className="contact__link" href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                  <span className="sys-label contact__link-href">{l.href}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
