# Step 4: Frontend Foundation

React + Vite + TypeScript로 프론트엔드 기초를 구축합니다.

## 🎯 학습 목표

1. Vite를 사용한 빠른 개발 환경 구축
2. TypeScript로 타입 안전한 React 개발
3. Tailwind CSS로 효율적인 스타일링
4. React Router로 SPA 라우팅
5. 프로젝트 구조 설계

## 📁 추가된 구조

```
frontend/
├── src/
│   ├── components/      # 재사용 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── Home.tsx
│   │   └── About.tsx
│   ├── lib/            # 유틸리티 함수
│   ├── App.tsx         # 메인 앱 컴포넌트
│   ├── main.tsx        # 진입점
│   └── index.css       # 전역 스타일
├── index.html          # HTML 템플릿
├── package.json        # 의존성
├── vite.config.ts      # Vite 설정
├── tsconfig.json       # TypeScript 설정
├── tailwind.config.js  # Tailwind 설정
└── postcss.config.js   # PostCSS 설정
```

## 🔍 주요 개념 설명

### 1. Vite

빠른 개발 서버와 최적화된 빌드를 제공하는 도구:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```

### 2. TypeScript 설정

타입 안전성을 위한 설정:

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

### 3. Tailwind CSS

유틸리티 우선 CSS 프레임워크:

```css
/* 클래스로 스타일 적용 */
<div className="bg-white rounded-lg shadow-md p-6">
```

### 4. 경로 별칭

깔끔한 import를 위한 설정:

```typescript
// '@/components/Button' 형태로 import 가능
"paths": {
  "@/*": ["src/*"]
}
```

## 🛠 개발 환경 설정

### 1. 의존성 설치
```bash
cd frontend
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. TypeScript 타입 체크
```bash
npm run build
```

### 4. 빌드 결과 미리보기
```bash
npm run preview
```

## 📋 주요 파일 설명

### vite.config.ts
- 개발 서버 설정
- 프록시 설정 (백엔드 연결)
- 경로 별칭 설정

### tailwind.config.js
- 커스텀 색상 정의
- 애니메이션 설정
- 테마 확장

### App.tsx
- React Router 설정
- 레이아웃 구조
- 전역 네비게이션

## 💡 다음 단계

다음 브랜치(`5_auth_backend`)에서는:
- JWT 인증 시스템
- 로그인/회원가입 API
- 비밀번호 해싱
- 인증 미들웨어

## 🤔 생각해볼 문제

1. Vite vs Create React App의 차이는?
2. TypeScript를 사용하는 이유는?
3. Tailwind CSS의 장단점은?
4. SPA의 장점과 단점은?

## 🚀 실습 과제

1. 새로운 페이지 컴포넌트 추가하기
2. 커스텀 컴포넌트 만들기
3. Tailwind 커스텀 클래스 추가
4. TypeScript 타입 정의 연습

## 📚 추가 학습 자료

- [Vite 공식 문서](https://vitejs.dev/)
- [React TypeScript 치트시트](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)