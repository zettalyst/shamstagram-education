# Step 2: Backend Foundation

Flask 백엔드의 기초를 구축합니다.

## 🎯 학습 목표

1. Flask 애플리케이션 팩토리 패턴 이해
2. 환경별 설정 관리 방법
3. CORS 설정과 필요성
4. Blueprint를 통한 라우트 구조화
5. 에러 핸들러 구현

## 📁 추가된 구조

```
backend/
├── app/
│   ├── __init__.py      # Flask 앱 팩토리
│   └── routes/
│       └── __init__.py  # 라우트 정의
├── config/
│   └── __init__.py      # 환경별 설정
├── requirements.txt     # Python 의존성
└── run.py              # 개발 서버 실행
```

## 🔍 주요 개념 설명

### 1. 애플리케이션 팩토리 패턴

```python
def create_app(config_class):
    app = Flask(__name__)
    app.config.from_object(config_class)
    # ... 설정 및 확장 초기화
    return app
```

**장점:**
- 테스트가 용이함
- 여러 인스턴스 생성 가능
- 설정 전환이 쉬움

### 2. CORS (Cross-Origin Resource Sharing)

프론트엔드(포트 8080)와 백엔드(포트 5000)가 다른 오리진에서 실행되므로 CORS 설정이 필요합니다.

```python
CORS(app, 
     origins=['http://localhost:8080'],
     supports_credentials=True)
```

### 3. Blueprint

라우트를 논리적으로 그룹화하여 관리합니다:

```python
main_bp = Blueprint('main', __name__)
health_bp = Blueprint('health', __name__)
```

### 4. 환경별 설정

개발과 프로덕션 환경을 구분하여 관리:

```python
class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    DEBUG = False
```

## 🚀 실행 방법

1. 가상환경 생성 및 활성화:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
# 또는
venv\Scripts\activate  # Windows
```

2. 의존성 설치:
```bash
pip install -r requirements.txt
```

3. 서버 실행:
```bash
python run.py
```

4. 테스트:
```bash
# 홈 페이지
curl http://localhost:5000/

# API 정보
curl http://localhost:5000/api

# 헬스체크
curl http://localhost:5000/api/health
```

## 💡 다음 단계

다음 브랜치(`3_database_models`)에서는:
- SQLAlchemy 설정
- 데이터베이스 모델 정의
- 마이그레이션 설정

## 🤔 생각해볼 문제

1. 왜 애플리케이션 팩토리 패턴을 사용할까?
2. CORS는 어떤 보안 문제를 해결하는가?
3. Blueprint의 장점은 무엇인가?
4. 환경 변수를 사용하는 이유는?

## 📚 추가 학습 자료

- [Flask 애플리케이션 팩토리](https://flask.palletsprojects.com/en/2.3.x/patterns/appfactories/)
- [CORS 이해하기](https://developer.mozilla.org/ko/docs/Web/HTTP/CORS)
- [Flask Blueprint](https://flask.palletsprojects.com/en/2.3.x/blueprints/)