# STEP 13: 좋아요 기능 구현

## 🎯 학습 목표

이번 단계에서는 게시물에 좋아요 기능을 구현합니다. 좋아요 토글, 개수 표시, 실시간 애니메이션 등을 통해 사용자 인터랙션을 향상시킵니다.

## 📋 구현 내용

### 1. 백엔드 구현

#### 1.1 좋아요 API 라우트 (`backend/app/routes/likes.py`)

```python
# 주요 엔드포인트
POST /api/posts/{post_id}/like     # 좋아요 토글
GET  /api/posts/{post_id}/likes    # 좋아요 정보 조회
GET  /api/posts/{post_id}/likes/users  # 좋아요 누른 사용자 목록
```

**핵심 기능:**
- 중복 좋아요 방지 (UniqueConstraint)
- 토글 기능 (좋아요/취소)
- 실시간 좋아요 수 계산
- JWT 인증을 통한 사용자 검증

#### 1.2 Like 모델 업데이트 (`backend/app/models/like.py`)

```python
class Like(db.Model):
    __tablename__ = 'likes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # 중복 좋아요 방지
    __table_args__ = (
        db.UniqueConstraint('user_id', 'post_id', name='unique_user_post_like'),
    )
```

#### 1.3 모델 관계 설정

**User 모델:**
```python
likes = db.relationship('Like', backref='user', lazy='dynamic', cascade='all, delete-orphan')
```

**Post 모델:**
```python
likes = db.relationship('Like', backref='post', lazy='dynamic', cascade='all, delete-orphan')
```

### 2. 프론트엔드 구현

#### 2.1 API 서비스 (`frontend/src/services/api.ts`)

```typescript
// 좋아요 토글
export async function toggleLike(postId: number): Promise<LikeToggleResponse>

// 좋아요 정보 조회
export async function getLikeInfo(postId: number): Promise<LikeInfo>
```

**타입 정의:**
```typescript
export interface LikeInfo {
  like_count: number;
  liked: boolean;
}

export interface LikeToggleResponse {
  success: boolean;
  liked: boolean;
  like_count: number;
  message: string;
}
```

#### 2.2 PostCard 컴포넌트 업데이트

**주요 기능:**
1. **실시간 좋아요 상태 로드**
2. **좋아요 토글 API 호출**
3. **애니메이션 효과**
4. **로딩 상태 관리**

```tsx
const handleLike = async () => {
  if (isLoading) return;
  
  try {
    setIsLoading(true);
    
    // 애니메이션 시작
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 600);
    
    // API 호출
    const response = await toggleLike(post.id);
    
    // 상태 업데이트
    setIsLiked(response.liked);
    setLikeCount(response.like_count);
    
  } catch (error) {
    console.error('좋아요 처리 실패:', error);
  } finally {
    setIsLoading(false);
  }
};
```

#### 2.3 CSS 애니메이션 (`frontend/src/index.css`)

```css
/* 키프레임 애니메이션 */
@keyframes heart-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

@keyframes like-explosion {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.8;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
```

## 🔧 주요 기술 사항

### 1. 데이터베이스 설계

- **복합 유니크 제약조건**: 사용자당 게시물별 하나의 좋아요만 허용
- **CASCADE 삭제**: 사용자나 게시물 삭제시 관련 좋아요도 함께 삭제
- **관계 설정**: User ↔ Like ↔ Post 다대다 관계

### 2. API 설계

- **RESTful 설계**: 직관적인 URL 구조
- **토글 방식**: 하나의 엔드포인트로 좋아요/취소 처리
- **실시간 정보**: 좋아요 수와 상태를 실시간으로 반환

### 3. 프론트엔드 최적화

- **낙관적 업데이트**: UI 먼저 업데이트 후 API 호출
- **로딩 상태**: 중복 클릭 방지
- **애니메이션**: 사용자 피드백 향상
- **에러 처리**: 실패시 원래 상태로 복원

## 🎨 UI/UX 개선사항

### 1. 애니메이션 효과

- **하트 애니메이션**: 좋아요시 하트 확대/축소
- **핑 이펙트**: 좋아요시 핑 애니메이션
- **색상 변화**: 좋아요 상태에 따른 색상 변경
- **호버 효과**: 마우스 오버시 스케일 변화

### 2. 시각적 피드백

- **실시간 카운트**: 좋아요 수 즉시 업데이트
- **상태 표시**: 현재 사용자의 좋아요 여부 표시
- **로딩 표시**: 처리 중일 때 투명도 조절
- **비활성화**: 로딩 중 버튼 비활성화

## 📁 파일 구조

```
backend/
├── app/
│   ├── routes/
│   │   └── likes.py                 # 새로 추가
│   └── models/
│       ├── like.py                  # 업데이트
│       ├── user.py                  # 관계 추가
│       └── post.py                  # 관계 추가

frontend/
├── src/
│   ├── services/
│   │   └── api.ts                   # 좋아요 API 추가
│   ├── components/
│   │   └── posts/
│   │       └── PostCard.tsx         # 좋아요 기능 구현
│   └── index.css                    # 애니메이션 추가
```

## 🧪 테스트 방법

### 1. 백엔드 테스트

```bash
# 개발 서버 실행
cd backend
python run.py

# API 테스트 (Postman 또는 curl)
POST /api/posts/1/like
Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. 프론트엔드 테스트

```bash
# 개발 서버 실행
cd frontend
npm run dev

# 브라우저에서 테스트
# 1. 게시물의 하트 버튼 클릭
# 2. 좋아요 수 변화 확인
# 3. 애니메이션 효과 확인
# 4. 새로고침 후 상태 유지 확인
```

## 🔍 주요 학습 포인트

### 1. 관계형 데이터베이스

- **다대다 관계**: User-Post 간 Like를 통한 다대다 관계
- **복합 키**: 여러 컬럼을 조합한 유니크 제약조건
- **CASCADE**: 참조 무결성과 자동 삭제

### 2. RESTful API 설계

- **리소스 중심**: `/posts/{id}/like` 구조
- **HTTP 메서드**: POST로 토글, GET으로 조회
- **상태 코드**: 적절한 HTTP 상태 코드 사용

### 3. React 상태 관리

- **useState**: 로컬 상태 관리
- **useEffect**: 컴포넌트 생명주기
- **비동기 처리**: async/await와 에러 처리

### 4. 사용자 경험 (UX)

- **즉각적 피드백**: 애니메이션과 상태 변화
- **로딩 상태**: 사용자에게 진행 상황 알림
- **에러 처리**: 실패시 적절한 복구

## 🚀 다음 단계 (STEP 14)

다음 단계에서는 **초대 시스템**을 구현할 예정입니다:

- 초대 토큰 생성 및 관리
- 이메일 기반 초대 시스템
- 초대 링크를 통한 회원가입
- 초대 현황 관리

## 🎓 학습 성과

이번 단계를 완료하면 다음을 학습할 수 있습니다:

- ✅ 다대다 관계 설계 및 구현
- ✅ RESTful API 설계 원칙
- ✅ React 상태 관리 최적화
- ✅ CSS 애니메이션 구현
- ✅ 사용자 인터랙션 향상 기법
- ✅ 실시간 UI 업데이트 패턴