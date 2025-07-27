# Shamstagram 교육 프로젝트 - STEP 5: JWT 인증 백엔드

## 단계 개요
JWT 토큰 기반 사용자 인증 시스템을 구현합니다. 회원가입, 로그인, 토큰 검증 등의 핵심 인증 기능을 제공합니다.

## 주요 구현 사항

### 1. 인증 서비스 (AuthService)
```python
# app/services/auth_service.py
class AuthService:
    @staticmethod
    def hash_password(password):
        """bcrypt로 비밀번호 해싱"""
        return bcrypt.hash(password)
    
    @staticmethod
    def verify_password(password, hashed):
        """비밀번호 검증"""
        return bcrypt.verify(password, hashed)
    
    @staticmethod
    def generate_token(user_id):
        """JWT 토큰 생성 (24시간 유효)"""
        payload = {
            'user_id': user_id,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24),
            'iat': datetime.now(timezone.utc)
        }
        return jwt.encode(payload, secret_key, algorithm='HS256')
```

### 2. 인증 라우트 (auth.py)
```python
# app/routes/auth.py
@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")  # 분당 5회 제한
def register():
    """회원가입 엔드포인트"""
    # 이메일, 비밀번호, 닉네임 유효성 검증
    # 중복 확인
    # 사용자 생성 및 토큰 반환

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")  # 분당 10회 제한  
def login():
    """로그인 엔드포인트"""
    # 사용자 인증
    # 토큰 생성 및 반환

@auth_bp.route('/me', methods=['GET'])
@auth_required
def get_current_user():
    """현재 사용자 정보 조회"""
    # 토큰에서 사용자 ID 추출
    # 사용자 정보 반환
```

### 3. 인증 데코레이터
```python
def auth_required(f):
    """인증이 필요한 엔드포인트를 위한 데코레이터"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Authorization 헤더에서 Bearer 토큰 추출
        # JWT 토큰 검증
        # request.user_id에 사용자 ID 설정
        return f(*args, **kwargs)
    return decorated_function
```

### 4. Rate Limiting 설정
```python
# app/__init__.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
```

### 5. 환경 설정 (config.py)
```python
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    RATELIMIT_STORAGE_URL = "memory://"

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///shamstagram_dev.db'
    CORS_ORIGINS = ['*']  # 개발 환경에서는 모든 origin 허용
```

## API 엔드포인트

### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123",
    "nickname": "사용자닉네임"
}

# 응답 (201 Created)
{
    "message": "회원가입이 완료되었습니다",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "nickname": "사용자닉네임",
        "avatar": 1
    }
}
```

### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}

# 응답 (200 OK)
{
    "message": "로그인 성공",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "nickname": "사용자닉네임",
        "avatar": 1
    }
}
```

### 사용자 정보 조회
```http
GET /api/auth/me
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# 응답 (200 OK)
{
    "user": {
        "id": 1,
        "email": "user@example.com",
        "nickname": "사용자닉네임",
        "avatar": 1,
        "created_at": "2024-01-01T00:00:00"
    }
}
```

### 토큰 검증
```http
GET /api/auth/verify
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# 응답 (200 OK)
{
    "valid": true,
    "user_id": 1
}
```

## 보안 기능

### 1. 비밀번호 해싱
- bcrypt 알고리즘 사용
- 자동 salt 생성
- 느린 해싱으로 브루트포스 공격 방지

### 2. JWT 토큰
- HS256 알고리즘 사용
- 24시간 유효기간
- 비밀키 기반 서명

### 3. Rate Limiting
- 회원가입: 분당 5회 제한
- 로그인: 분당 10회 제한
- 전체 API: 시간당 50회, 일당 200회 제한

### 4. 입력 검증
- 이메일 형식 검증
- 비밀번호 최소 길이 (6자)
- 닉네임 길이 제한 (2-20자)
- 중복 이메일/닉네임 확인

## 환경 변수 설정

```bash
# .env 파일
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DEV_DATABASE_URL=sqlite:///instance/shamstagram_dev.db
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
```

## 테스트 방법

### 1. 서버 실행
```bash
cd backend
python run.py
```

### 2. API 테스트 (curl 예시)
```bash
# 회원가입
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","nickname":"테스트"}'

# 로그인
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# 사용자 정보 조회 (토큰 필요)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me
```

## 학습 포인트

1. **JWT 토큰 기반 인증**: 상태를 저장하지 않는 토큰 기반 인증 시스템
2. **비밀번호 보안**: bcrypt를 이용한 안전한 비밀번호 저장
3. **Rate Limiting**: API 남용 방지를 위한 요청 제한
4. **데코레이터 패턴**: 인증이 필요한 라우트에 쉽게 적용할 수 있는 데코레이터
5. **환경별 설정**: 개발/테스트/프로덕션 환경에 따른 설정 분리
6. **에러 처리**: 일관된 에러 응답과 적절한 HTTP 상태 코드

## 다음 단계 (STEP 6)
- React 프론트엔드에서 인증 시스템 구현
- AuthContext로 전역 인증 상태 관리
- Protected Routes로 인증이 필요한 페이지 보호
- 로그인/회원가입 UI 구현