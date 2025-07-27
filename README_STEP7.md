# Shamstagram 교육 프로젝트 - STEP 7: 게시물 백엔드 API

## 단계 개요
게시물 CRUD(생성, 조회, 수정, 삭제) API를 구현합니다. 페이지네이션, 좋아요 상태 확인, 사용자별 게시물 조회 등의 핵심 기능을 제공합니다.

## 주요 구현 사항

### 1. 게시물 라우트 (posts.py)
```python
# app/routes/posts.py
posts_bp = Blueprint('posts', __name__, url_prefix='/api/posts')

@posts_bp.route('', methods=['GET'])
@auth_required
def get_posts():
    """게시물 목록 조회 (페이지네이션 포함)"""
    page = request.args.get('page', 1, type=int)
    limit = min(request.args.get('limit', 10, type=int), 50)  # 최대 50개
    
    # 게시물 쿼리 (최신순)
    posts_query = Post.query.order_by(desc(Post.created_at))
    
    # 페이지네이션 적용
    paginated = posts_query.paginate(
        page=page,
        per_page=limit,
        error_out=False
    )
    
    # 현재 사용자가 좋아요한 게시물 ID 목록
    liked_post_ids = db.session.query(Like.post_id).filter_by(
        user_id=request.user_id
    ).all()
```

### 2. 게시물 생성 (POST)
```python
@posts_bp.route('', methods=['POST'])
@auth_required
@limiter.limit("5 per minute")  # 분당 5개 게시물 제한
def create_post():
    """새 게시물 작성"""
    text = data['text'].strip()
    
    # 게시물 길이 검증 (최소 1자, 최대 500자)
    if len(text) < 1 or len(text) > 500:
        return jsonify({'error': '게시물은 1-500자 사이여야 합니다'}), 400
    
    # 게시물 생성
    post = Post(
        user_id=request.user_id,
        original_text=text,
        ai_text=text,  # 임시로 원본 텍스트 사용 (AI 변환은 9단계에서 구현)
        likes=random.randint(50000, 2000000)  # 데모용 초기 좋아요 수
    )
    
    db.session.add(post)
    db.session.commit()
```

### 3. 게시물 수정 (PUT)
```python
@posts_bp.route('/<int:post_id>', methods=['PUT'])
@auth_required
def update_post(post_id):
    """게시물 수정"""
    post = Post.query.get(post_id)
    
    # 작성자 확인
    if post.user_id != request.user_id:
        return jsonify({'error': '게시물을 수정할 권한이 없습니다'}), 403
    
    # 게시물 업데이트
    post.original_text = text
    post.ai_text = text  # 임시로 원본 텍스트 사용
    
    db.session.commit()
```

### 4. 게시물 삭제 (DELETE)
```python
@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@auth_required
def delete_post(post_id):
    """게시물 삭제"""
    post = Post.query.get(post_id)
    
    # 작성자 확인
    if post.user_id != request.user_id:
        return jsonify({'error': '게시물을 삭제할 권한이 없습니다'}), 403
    
    # 관련 좋아요와 댓글도 자동으로 삭제됨 (cascade 설정에 의해)
    db.session.delete(post)
    db.session.commit()
```

### 5. 사용자별 게시물 조회
```python
@posts_bp.route('/user/<int:user_id>', methods=['GET'])
@auth_required
def get_user_posts(user_id):
    """특정 사용자의 게시물 목록 조회"""
    # 사용자 존재 확인
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '사용자를 찾을 수 없습니다'}), 404
    
    # 해당 사용자의 게시물 쿼리
    posts_query = Post.query.filter_by(user_id=user_id).order_by(desc(Post.created_at))
```

### 6. 샘플 데이터 생성 (init_db.py)
```python
# 샘플 사용자 생성
sample_users = [
    {
        'email': 'demo@example.com',
        'nickname': '과장왕',
        'password': 'demo1234',
        'avatar': 1
    },
    {
        'email': 'test@example.com',
        'nickname': '허풍쟁이',
        'password': 'test1234',
        'avatar': 2
    }
]

# 샘플 게시물 생성
sample_posts = [
    "오늘 점심에 라면 먹었어요",
    "주말에 집에서 쉬었습니다",
    "새로운 프로젝트 시작했어요",
    "운동 30분 했습니다",
    "책 한 권 읽었어요"
]
```

## API 엔드포인트

### 1. 게시물 목록 조회
```http
GET /api/posts?page=1&limit=10
Authorization: Bearer {token}

# 응답 (200 OK)
{
    "posts": [
        {
            "id": 1,
            "original_text": "오늘 점심에 라면 먹었어요",
            "ai_text": "[AI 변환 예정] 오늘 점심에 라면 먹었어요",
            "likes": 1234567,
            "created_at": "2024-01-01T12:00:00",
            "is_liked": false,
            "author": {
                "id": 1,
                "nickname": "과장왕",
                "avatar": 1
            }
        }
    ],
    "pagination": {
        "page": 1,
        "pages": 5,
        "per_page": 10,
        "total": 50,
        "has_prev": false,
        "has_next": true
    }
}
```

### 2. 게시물 생성
```http
POST /api/posts
Authorization: Bearer {token}
Content-Type: application/json

{
    "text": "새로운 게시물 내용"
}

# 응답 (201 Created)
{
    "message": "게시물이 작성되었습니다",
    "post": {
        "id": 2,
        "original_text": "새로운 게시물 내용",
        "ai_text": "새로운 게시물 내용",
        "likes": 987654,
        "created_at": "2024-01-01T15:30:00",
        "is_liked": false,
        "author": {
            "id": 1,
            "nickname": "과장왕",
            "avatar": 1
        }
    }
}
```

### 3. 특정 게시물 조회
```http
GET /api/posts/1
Authorization: Bearer {token}

# 응답 (200 OK)
{
    "post": {
        "id": 1,
        "original_text": "오늘 점심에 라면 먹었어요",
        "ai_text": "[AI 변환 예정] 오늘 점심에 라면 먹었어요",
        "likes": 1234567,
        "created_at": "2024-01-01T12:00:00",
        "is_liked": false,
        "author": {
            "id": 1,
            "nickname": "과장왕",
            "avatar": 1
        }
    }
}
```

### 4. 게시물 수정
```http
PUT /api/posts/1
Authorization: Bearer {token}
Content-Type: application/json

{
    "text": "수정된 게시물 내용"
}

# 응답 (200 OK)
{
    "message": "게시물이 수정되었습니다",
    "post": {
        "id": 1,
        "original_text": "수정된 게시물 내용",
        "ai_text": "수정된 게시물 내용",
        "likes": 1234567,
        "created_at": "2024-01-01T12:00:00",
        "is_liked": false,
        "author": {
            "id": 1,
            "nickname": "과장왕",
            "avatar": 1
        }
    }
}
```

### 5. 게시물 삭제
```http
DELETE /api/posts/1
Authorization: Bearer {token}

# 응답 (200 OK)
{
    "message": "게시물이 삭제되었습니다"
}
```

### 6. 사용자별 게시물 조회
```http
GET /api/posts/user/1?page=1&limit=10
Authorization: Bearer {token}

# 응답 (200 OK)
{
    "posts": [...],
    "user": {
        "id": 1,
        "nickname": "과장왕",
        "avatar": 1
    },
    "pagination": {...}
}
```

## 주요 기능

### 1. 페이지네이션
- **page**: 페이지 번호 (기본값: 1)
- **limit**: 페이지당 항목 수 (기본값: 10, 최대: 50)
- **pagination 정보**: 총 페이지 수, 이전/다음 페이지 여부 등

### 2. 권한 관리
- **인증 확인**: 모든 API에 `@auth_required` 데코레이터 적용
- **작성자 확인**: 수정/삭제 시 게시물 작성자만 가능
- **권한 에러**: 403 Forbidden 상태 코드 반환

### 3. 데이터 검증
- **텍스트 길이**: 1-500자 사이 제한
- **빈 값 확인**: 필수 필드 검증
- **SQL Injection 방지**: SQLAlchemy ORM 사용

### 4. Rate Limiting
- **게시물 생성**: 분당 5개 제한
- **스팸 방지**: Flask-Limiter로 요청 제한

### 5. 좋아요 상태 확인
- **is_liked**: 현재 사용자가 좋아요했는지 여부
- **효율적 쿼리**: 배치로 좋아요 상태 확인

### 6. 작성자 정보 포함
- **author 객체**: 닉네임, 아바타 정보
- **JOIN 쿼리**: 효율적인 사용자 정보 조회

## 에러 처리

### 1. HTTP 상태 코드
- **200**: 성공적인 조회/수정/삭제
- **201**: 성공적인 생성
- **400**: 잘못된 요청 (검증 실패)
- **401**: 인증 실패
- **403**: 권한 없음
- **404**: 리소스 없음
- **500**: 서버 내부 오류

### 2. 에러 메시지
```json
{
    "error": "구체적인 에러 메시지"
}
```

### 3. 예외 처리
- **try-catch**: 모든 라우트에 예외 처리
- **rollback**: 에러 시 데이터베이스 롤백
- **로깅**: 서버 오류 로깅 (추후 구현)

## 데이터베이스 관계

### 1. 외래키 관계
- **Post.user_id** → **User.id**
- **Like.user_id** → **User.id**
- **Like.post_id** → **Post.id**

### 2. Cascade 삭제
- 사용자 삭제 시: 해당 사용자의 모든 게시물, 좋아요 삭제
- 게시물 삭제 시: 해당 게시물의 모든 좋아요, 댓글 삭제

## 테스트 방법

### 1. 데이터베이스 초기화
```bash
cd backend
python init_db.py
```

### 2. 서버 실행
```bash
python run.py
```

### 3. API 테스트 (curl 예시)
```bash
# 로그인 후 토큰 획득
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo1234"}' \
  | jq -r '.token')

# 게시물 목록 조회
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/posts?page=1&limit=10"

# 게시물 생성
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"테스트 게시물입니다"}'

# 게시물 조회
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/posts/1"

# 게시물 수정 (작성자만)
curl -X PUT http://localhost:5000/api/posts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"수정된 게시물입니다"}'

# 게시물 삭제 (작성자만)
curl -X DELETE http://localhost:5000/api/posts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## 성능 최적화

### 1. 데이터베이스 쿼리
- **인덱스**: created_at, user_id에 인덱스 설정
- **배치 쿼리**: 좋아요 상태를 한 번에 조회
- **JOIN 최적화**: 필요한 필드만 SELECT

### 2. 페이지네이션
- **OFFSET/LIMIT**: SQLAlchemy의 paginate() 사용
- **쿼리 최적화**: 불필요한 COUNT 쿼리 방지

### 3. 캐싱 (추후 구현)
- **Redis**: 인기 게시물 캐싱
- **메모리 캐시**: 사용자 정보 캐싱

## 학습 포인트

1. **RESTful API**: HTTP 메서드와 상태 코드의 올바른 사용
2. **페이지네이션**: 대용량 데이터 처리를 위한 페이징
3. **권한 관리**: 리소스 소유자 확인과 접근 제어
4. **데이터 검증**: 입력 데이터의 유효성 검증
5. **에러 처리**: 일관된 에러 응답과 예외 처리
6. **Rate Limiting**: API 남용 방지
7. **데이터베이스 관계**: ORM을 통한 관계형 데이터 처리

## 다음 단계 (STEP 8)
- React에서 게시물 목록 표시
- PostCard 컴포넌트 구현
- 게시물 생성/수정 폼
- 무한 스크롤 또는 페이지네이션 UI