# Shamstagram Frontend

React와 TypeScript로 구축된 프론트엔드 애플리케이션입니다.

## 🛠 기술 스택

- React 18
- TypeScript
- Vite (빌드 도구)
- Tailwind CSS (스타일링)
- shadcn/ui (UI 컴포넌트)
- React Router (라우팅)
- Tanstack Query (상태 관리)

## 📁 프로젝트 구조

```
frontend/
├── public/                 # 정적 파일
├── src/                    # 소스 코드
│   ├── assets/            # 이미지, 폰트 등
│   ├── components/        # 재사용 가능한 컴포넌트
│   │   └── ui/           # shadcn/ui 컴포넌트
│   ├── hooks/             # 커스텀 훅
│   ├── lib/               # 유틸리티 함수
│   ├── pages/             # 페이지 컴포넌트
│   ├── services/          # API 통신
│   ├── types/             # TypeScript 타입 정의
│   ├── App.tsx            # 메인 앱 컴포넌트
│   ├── main.tsx           # 앱 진입점
│   └── index.css          # 글로벌 스타일
├── .env.example           # 환경 변수 예시
├── index.html             # HTML 템플릿
├── package.json           # 프로젝트 의존성
├── tsconfig.json          # TypeScript 설정
├── vite.config.ts         # Vite 설정
└── tailwind.config.js     # Tailwind CSS 설정
```

## 🚀 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 🔧 환경 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 환경 변수를 설정하세요:

```bash
cp .env.example .env
```

## 🎨 UI 컴포넌트

이 프로젝트는 shadcn/ui를 사용합니다. 새로운 컴포넌트를 추가하려면:

```bash
npx shadcn-ui@latest add [component-name]
```