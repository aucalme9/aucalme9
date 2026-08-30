import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import ProjectsList from './pages/ProjectsList'
import ProjectDetail from './pages/ProjectDetail'
import About from './pages/About'
import Contact from './pages/Contact'

export default function App() {
  return (
    <>
      {/* 모든 페이지 공통 상단바 (내용은 src/components/Header.jsx) */}
      <Header />

      <main>
        {/* ── 페이지 라우팅 구간 ─────────────────────────────────────────
            [경로 변경] path 문자열이 곧 URL 입니다. (해시 라우터라 실제로는 /#/about 형태)
            [페이지 추가] 새 페이지 = 여기에 <Route ...> 한 줄 추가 + 위쪽에 import.
            [페이지 삭제] 해당 <Route> 줄 삭제 + Header.jsx 메뉴에서도 제거. */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />{/* :slug = projects.js 의 slug 값 */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>

      {/* 모든 페이지 공통 하단 푸터 (내용은 src/components/Footer.jsx) */}
      <Footer />
    </>
  )
}
