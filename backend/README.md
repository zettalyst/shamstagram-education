# Shamstagram Backend

Flask 기반의 백엔드 API 서버입니다.

## 🛠 기술 스택

- Python 3.9+
- Flask (웹 프레임워크)
- SQLAlchemy (ORM)
- JWT (인증)
- OpenAI API (AI 텍스트 변환)

## 📁 프로젝트 구조

```
backend/
├── app/                    # 애플리케이션 코드
│   ├── __init__.py        # Flask 앱 초기화
│   ├── models/            # 데이터베이스 모델
│   ├── routes/            # API 엔드포인트
│   ├── services/          # 비즈니스 로직
│   └── utils/             # 유틸리티 함수
├── config/                 # 설정 파일
├── migrations/             # 데이터베이스 마이그레이션
├── tests/                  # 테스트 코드
├── requirements.txt        # Python 의존성
├── .env.example           # 환경 변수 예시
└── run.py                 # 개발 서버 실행 파일
```

## 🚀 설치 및 실행

```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
venv\Scripts\activate

# 가상환경 활성화 (Mac/Linux)
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
python run.py
```

## 🔧 환경 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 환경 변수를 설정하세요:

```bash
cp .env.example .env
```

## 📚 API 문서

API 엔드포인트 문서는 `/docs` 디렉토리에서 확인할 수 있습니다.