/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // 더 많은 환경 변수를 여기에 추가할 수 있습니다
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}