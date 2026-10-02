import PlexusField from '../components/PlexusField'
import './Home.css'

// Home — 화면 전체(100vh)를 채우는 단일 2D 인터랙션(점-선 네트워크 + 마우스 사운드)로만 구성.
//  ※ 이전의 Hero 텍스트 / Selected Works / Pipeline / Learning·Evolution / 3D 비주얼은 모두 제거됨.
//  본체: src/components/PlexusField.jsx (+ plexusAudio.js — Web Audio 코드 합성).
export default function Home() {
  return (
    <div className="home">
      <PlexusField />
    </div>
  )
}
