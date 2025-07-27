# Step 1: Project Setup

이 브랜치에서는 Shamstagram 프로젝트의 기본 구조를 설정합니다.

## 🎯 학습 목표

1. 풀스택 프로젝트의 폴더 구조 이해
2. Git 브랜치 전략 학습
3. 환경 변수 관리 방법
4. 프로젝트 문서화의 중요성

## 📁 생성된 구조

```
shamstagram-education/
├── backend/              # 백엔드 (Flask) 코드
│   └── README.md        # 백엔드 설명서
├── frontend/            # 프론트엔드 (React) 코드
│   └── README.md        # 프론트엔드 설명서
├── docs/                # 프로젝트 문서
│   └── project-overview.md  # 프로젝트 개요
├── .env.example         # 환경 변수 예시
├── .gitignore          # Git 무시 파일
├── README.md           # 프로젝트 메인 설명서
└── README_STEP1.md     # 현재 단계 설명서 (이 파일)
```

## 🔍 주요 파일 설명

### 1. `.gitignore`
Git에서 추적하지 않을 파일들을 정의합니다:
- Python 캐시 파일 (`__pycache__/`)
- 환경 파일 (`.env`)
- 빌드 결과물 (`dist/`, `build/`)
- 에디터 설정 (`.vscode/`, `.idea/`)

### 2. `.env.example`
환경 변수 템플릿으로, 실제 사용 시:
```bash
cp .env.example .env
```
명령으로 복사 후 실제 값을 입력합니다.

### 3. 폴더별 README
각 폴더의 역할과 구조를 설명하여 프로젝트 이해도를 높입니다.

## 💡 다음 단계

다음 브랜치(`2_backend_foundation`)에서는:
- Flask 애플리케이션 초기화
- 기본 라우트 설정
- CORS 설정
- 에러 핸들러 구현

## 🚀 실습

1. 이 구조를 기반으로 자신만의 프로젝트 생성해보기
2. `.gitignore`에 추가할 파일 생각해보기
3. 환경 변수로 관리해야 할 설정 고민해보기

## 📚 참고 자료

- [Flask 프로젝트 구조 베스트 프랙티스](https://flask.palletsprojects.com/en/2.3.x/patterns/packages/)
- [React 프로젝트 구조](https://react.dev/learn/start-a-new-react-project)
- [12 Factor App - 환경 설정](https://12factor.net/config)