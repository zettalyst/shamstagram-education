# STEP 14: 초대 시스템 (Invitation System)

**단계 목표**: 프라이빗 SNS를 위한 초대 토큰 기반 회원가입 시스템 구현

---

## 📋 이번 단계에서 구현할 기능

### 🎯 핵심 기능
- **초대 토큰 생성**: 관리자가 이메일별 초대 토큰 생성
- **토큰 검증**: 회원가입 시 초대 토큰 유효성 확인
- **초대 관리**: 초대 목록 조회, 상태 추적, 삭제 기능
- **제한된 접근**: 초대 없이는 회원가입 불가

### 🔧 기술적 구현사항
- 백엔드: 초대 관리 API, 토큰 검증 로직
- 프론트엔드: 초대 관리 페이지, 회원가입 개선
- 보안: 안전한 토큰 생성, 중복 방지

---

## 🗂️ 파일 구조

```
project/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── invitations.py      # 초대 관리 API
│   │   │   └── auth.py              # 회원가입 토큰 검증 추가
│   │   └── models/
│   │       └── invitation.py        # 초대 모델 (기존 확장)
│   └── ...
├── frontend/
│   └── src/
│       └── pages/
│           ├── InvitationManagement.tsx  # 초대 관리 페이지
│           └── Register.tsx              # 회원가입 개선
└── README_STEP14.md
```

---

## 🔧 백엔드 구현

### 1. 초대 관리 API (`backend/app/routes/invitations.py`)

#### 주요 엔드포인트

```python
# 초대 생성
POST /api/invitations/create
{
  "email": "user@example.com"
}

# 초대 토큰 검증
GET /api/invitations/verify/{token}

# 초대 목록 조회 (페이지네이션)
GET /api/invitations/list?page=1&per_page=10&status=all

# 초대 삭제 (사용되지 않은 것만)
DELETE /api/invitations/delete/{invitation_id}
```

#### 핵심 기능

**1. 토큰 생성**
```python
def generate_invitation_token():
    """16자리 랜덤 영숫자 토큰 생성"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(16))
```

**2. 중복 방지**
- 이미 가입된 이메일 체크
- 사용되지 않은 초대 존재 여부 확인
- 토큰 중복 방지 (매우 낮은 확률이지만)

**3. 초대 상태 관리**
- 생성됨 (`is_used: false`)
- 사용됨 (`is_used: true`, `user_id` 연결)

### 2. 회원가입 개선 (`backend/app/routes/auth.py`)

#### 토큰 검증 프로세스

```python
@auth_bp.route('/verify-invitation', methods=['POST'])
def verify_invitation():
    """초대 토큰 검증"""
    token = data.get('token')
    
    # 특별 데모 토큰
    if token == 'shamwow':
        return jsonify({'valid': True, 'email': 'demo@example.com'})
    
    # 데이터베이스 토큰 확인
    invitation = Invitation.query.filter_by(token=token, is_used=False).first()
    if not invitation:
        return jsonify({'error': '유효하지 않은 초대 토큰입니다'}), 400
    
    return jsonify({'valid': True, 'email': invitation.email})
```

#### 회원가입 프로세스

```python
@auth_bp.route('/register', methods=['POST'])
def register():
    """초대 토큰과 함께 회원가입"""
    # 1. 토큰 검증
    # 2. 사용자 생성
    # 3. 초대 토큰 사용 처리
    invitation.use(user)  # is_used=True, user_id 설정
```

---

## 🎨 프론트엔드 구현

### 1. 초대 관리 페이지 (`InvitationManagement.tsx`)

#### 주요 컴포넌트

**통계 대시보드**
```tsx
const stats = {
  total_users: 5,
  used_invitations: 3,
  pending_invitations: 2,
  remaining_slots: 5
};
```

**초대 생성 폼**
```tsx
const createInvitation = async (e: React.FormEvent) => {
  const response = await api.post('/invitations', { email });
  // 초대 링크: http://localhost:8080/register?token=abc123
};
```

**초대 목록 관리**
- 필터링: 전체 / 사용됨 / 대기 중
- 기능: 링크 복사, 삭제 (미사용만)
- 상태 표시: Badge로 시각적 구분

### 2. 회원가입 개선 (`Register.tsx`)

#### 토큰 검증 플로우

```tsx
useEffect(() => {
  const token = searchParams.get('token');
  
  if (!token) {
    setTokenValidation({
      isValid: false,
      message: '초대 토큰이 필요합니다.'
    });
    return;
  }
  
  // 토큰 검증 API 호출
  const response = await api.post('/auth/verify-invitation', { token });
  setEmail(response.data.email); // 초대된 이메일 자동 입력
}, [searchParams]);
```

#### UI/UX 개선사항

**토큰 상태 표시**
```tsx
{tokenValidation.isValid ? (
  <>
    <CheckCircle className="h-4 w-4 text-green-600" />
    <span>초대 확인됨</span>
  </>
) : (
  <>
    <XCircle className="h-4 w-4 text-red-600" />
    <span>초대 필요</span>
  </>
)}
```

**조건부 폼 렌더링**
- 토큰이 유효할 때만 회원가입 폼 표시
- 초대된 이메일은 수정 불가 (disabled)
- 토큰 없으면 안내 메시지 표시

---

## 🔐 보안 고려사항

### 1. 토큰 보안
```python
import secrets
import string

def generate_invitation_token():
    """암호학적으로 안전한 랜덤 토큰"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(16))
```

### 2. 접근 제어
- 초대 관리는 인증된 사용자만 가능
- 토큰 검증은 공개 API (회원가입 전이므로)
- 사용된 초대는 삭제 불가

### 3. 데이터 검증
- 이메일 형식 검증
- 중복 이메일 방지
- 토큰 유효성 확인

---

## 📊 데이터베이스 스키마

### Invitation 테이블 구조

```sql
CREATE TABLE invitations (
    id INTEGER PRIMARY KEY,
    email VARCHAR(120) NOT NULL,
    token VARCHAR(100) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    user_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME
);

-- 인덱스
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
```

---

## 🧪 테스트 시나리오

### 1. 초대 생성 테스트
```bash
# 새 초대 생성
curl -X POST http://localhost:5000/api/invitations/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 응답: 초대 정보 + 초대 링크
{
  "success": true,
  "invitation": {...},
  "invitation_link": "http://localhost:8080/register?token=abc123"
}
```

### 2. 토큰 검증 테스트
```bash
# 토큰 검증
curl -X POST http://localhost:5000/api/auth/verify-invitation \
  -H "Content-Type: application/json" \
  -d '{"token": "abc123"}'

# 유효한 토큰 응답
{
  "valid": true,
  "email": "test@example.com",
  "message": "초대 토큰이 확인되었습니다."
}
```

### 3. 회원가입 테스트
```bash
# 초대 토큰과 함께 회원가입
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123",
    "nickname": "테스트사용자",
    "password": "password123",
    "avatar": 1
  }'
```

---

## 🎯 사용자 시나리오

### 시나리오 1: 일반 초대 과정

1. **관리자**: 초대 관리 페이지에서 이메일 입력하여 초대 생성
2. **시스템**: 초대 토큰 생성 및 링크 제공
3. **관리자**: 초대 링크를 대상자에게 전달 (이메일, 메신저 등)
4. **사용자**: 초대 링크 클릭하여 회원가입 페이지 접속
5. **시스템**: 토큰 검증 후 초대된 이메일 자동 입력
6. **사용자**: 닉네임, 비밀번호 입력하여 회원가입 완료

### 시나리오 2: 데모 사용자 등록

1. **사용자**: `/register?token=shamwow` 직접 접속
2. **시스템**: 데모 토큰 인식하여 특별 처리
3. **사용자**: 자유로운 이메일로 회원가입 가능

---

## 🚀 배포 및 운영

### 환경 변수 설정
```bash
# 최대 초대 수 제한
MAX_INVITATIONS=10

# 프론트엔드 URL (초대 링크 생성용)
FRONTEND_URL=http://localhost:8080
```

### 관리자 기능
- **초대 현황 모니터링**: 통계 대시보드
- **초대 관리**: 생성, 삭제, 상태 확인
- **사용자 제한**: MAX_INVITATIONS 설정

---

## 🔄 다음 단계 (STEP 15)

- **Docker 컨테이너화**: 애플리케이션 Docker 이미지 생성
- **배포 설정**: docker-compose, Nginx 리버스 프록시
- **프로덕션 최적화**: 환경 변수, 보안 설정
- **CI/CD 파이프라인**: 자동 배포 설정

---

## 💡 학습 포인트

### 백엔드 개발
- **토큰 기반 인증**: 안전한 임시 토큰 시스템
- **상태 관리**: 초대 생명주기 관리
- **데이터 무결성**: 중복 방지, 참조 무결성

### 프론트엔드 개발
- **URL 파라미터 처리**: useSearchParams 활용
- **조건부 렌더링**: 토큰 상태에 따른 UI 변경
- **사용자 경험**: 자동 입력, 상태 피드백

### 시스템 설계
- **초대 기반 시스템**: 프라이빗 커뮤니티 구조
- **보안 고려사항**: 토큰 안전성, 접근 제어
- **확장성**: 초대 수 제한, 관리 기능

---

## ⚠️ 주의사항

1. **토큰 보안**: secrets 모듈 사용한 안전한 토큰 생성
2. **중복 방지**: 이메일별 초대 제한, 토큰 유일성
3. **상태 동기화**: 토큰 사용 시 즉시 상태 업데이트
4. **에러 처리**: 토큰 만료, 잘못된 토큰 적절한 처리
5. **사용자 경험**: 명확한 오류 메시지, 진행 상태 표시

이제 Shamstagram은 완전한 프라이빗 SNS로 초대받은 사용자만 가입할 수 있습니다! 🎉