import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 배포 시 저장소 이름으로 base 경로를 지정해야 합니다.
// 예: 저장소가 github.com/유저명/portfolio 라면 base: '/portfolio/'
// 커스텀 도메인을 사용할 경우 base: '/' 로 변경하세요.
export default defineConfig({
  plugins: [react()],
  base: '/portfolio/',
})
