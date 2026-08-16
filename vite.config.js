import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // 같은 네트워크의 휴대폰에서 PC IP로 접속해 확인할 수 있게 LAN에 연다.
  // dev 실행 시 터미널의 Network 주소가 휴대폰에서 여는 주소다.
  server: {
    host: true,
    // 휴대폰의 origin(IP:5173)은 백엔드 CORS 허용 목록에 없어 직접 호출이
    // 막힌다. /backend 접두사를 개발 서버가 대신 전달해 same-origin으로
    // 만든다. .env의 VITE_API_BASE_URL=/backend 와 짝이다. 접두사를 두는
    // 이유: /products처럼 앱 라우트와 같은 이름의 API 경로가 있어, 경로를
    // 그대로 프록시하면 새로고침이 백엔드 JSON을 받게 된다.
    proxy: {
      '/backend': {
        target: 'https://boardingpass.p-e.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, ''),
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    css: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: './src/test/setup.js',
  },
})
