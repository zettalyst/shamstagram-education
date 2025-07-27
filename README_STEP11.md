# Shamstagram 교육 프로젝트 - STEP 11: 댓글 백엔드 시스템

## 단계 개요
댓글 CRUD API와 스레드 구조를 구현하고, 봇 페르소나 시스템과 연동하여 자동 댓글 생성 기능을 완성합니다. 사용자 댓글 작성 시 봇들이 자동으로 대댓글을 생성하는 실시간 상호작용 시스템을 구현합니다.

## 주요 구현 사항

### 1. 댓글 모델 (comment.py)
```python
# backend/app/models/comment.py
class Comment(db.Model):
    """댓글 모델 - 스레드 구조 지원"""
    
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # 봇은 user_id가 없음
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)  # 대댓글용
    
    # 댓글 내용
    original_text = db.Column(db.Text, nullable=True)  # 원본 텍스트
    content = db.Column(db.Text, nullable=False)  # 표시될 내용 (AI 변환 또는 봇 댓글)
    
    # 봇 댓글 관련
    bot_name = db.Column(db.String(50), nullable=True)  # 봇 이름
    is_bot = db.Column(db.Boolean, default=False)  # 봇 댓글 여부
    delay = db.Column(db.Integer, nullable=True)  # 지연 시간 (초)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 자기 참조 관계 (대댓글)
    replies = db.relationship(
        'Comment',
        backref=db.backref('parent', remote_side=[id]),
        cascade='all, delete-orphan'
    )
```

### 2. 댓글 API 라우트 (comments.py)
```python
# backend/app/routes/comments.py
@bp.route('/', methods=['POST'])
@auth_required
def create_comment():
    """댓글 생성 및 봇 대댓글 자동 스케줄링"""
    data = request.get_json()
    post_id = data.get('post_id')
    content = data.get('content')
    parent_id = data.get('parent_id')  # 대댓글인 경우
    
    # 게시물 존재 확인
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': '게시물을 찾을 수 없습니다'}), 404
    
    # AI로 댓글 변환 (선택적)
    ai_content = ai_service.transform_text(content)
    
    # 댓글 생성
    comment = Comment(
        post_id=post_id,
        user_id=get_jwt_identity(),
        parent_id=parent_id,
        original_text=content,
        content=ai_content if ai_content else content,
        is_bot=False
    )
    
    db.session.add(comment)
    db.session.commit()
    
    # 봇 대댓글 스케줄링 (최상위 댓글인 경우만)
    if not parent_id:
        _schedule_bot_replies(comment.id, post.ai_text or post.original_text)
    
    return jsonify({
        'message': '댓글이 생성되었습니다',
        'comment': comment.to_dict()
    }), 201
```

### 3. 스레드 구조 댓글 조회
```python
@bp.route('/post/<int:post_id>', methods=['GET'])
def get_post_comments(post_id):
    """특정 게시물의 모든 댓글 조회 (스레드 구조)"""
    # 최상위 댓글만 조회 (parent_id가 None인 것)
    top_level_comments = Comment.query.filter_by(
        post_id=post_id,
        parent_id=None
    ).order_by(Comment.created_at.desc()).all()
    
    # 스레드 구조로 변환
    comments_data = [comment.to_dict(include_replies=True) for comment in top_level_comments]
    
    return jsonify({
        'comments': comments_data,
        'total': len(comments_data)
    }), 200
```

### 4. 댓글 삭제 (소프트 삭제)
```python
@bp.route('/<int:comment_id>', methods=['DELETE'])
@auth_required
def delete_comment(comment_id):
    """댓글 삭제 (작성자만 가능)"""
    user_id = get_jwt_identity()
    comment = Comment.query.get(comment_id)
    
    # 작성자 확인
    if comment.user_id != user_id:
        return jsonify({'error': '본인의 댓글만 삭제할 수 있습니다'}), 403
    
    # 대댓글이 있는 경우 내용만 변경 (소프트 삭제)
    if comment.replies:
        comment.content = "[삭제된 댓글입니다]"
        comment.original_text = None
    else:
        # 대댓글이 없으면 완전 삭제
        db.session.delete(comment)
    
    db.session.commit()
    return jsonify({'message': '댓글이 삭제되었습니다'}), 200
```

### 5. 봇 대댓글 자동 생성
```python
def _schedule_bot_replies(comment_id, context_text):
    """사용자 댓글에 대한 봇 대댓글 스케줄링"""
    # 봇 2개 선택
    selected_bots = random.sample(bot_service.bot_personas, min(2, len(bot_service.bot_personas)))
    
    for index, bot in enumerate(selected_bots):
        # 대댓글은 더 빠르게 생성 (2-6초)
        delay = random.randint(2, 6) + (index * 1.5)
        
        timer = threading.Timer(
            delay,
            _create_bot_reply,
            args=[comment_id, bot, context_text]
        )
        timer.start()

def _create_bot_reply(parent_comment_id, bot_persona, context_text):
    """봇 대댓글 생성"""
    try:
        # Flask 앱 컨텍스트 설정
        from app import create_app
        app = create_app()
        
        with app.app_context():
            # 부모 댓글 확인
            parent_comment = Comment.query.get(parent_comment_id)
            if not parent_comment:
                return
            
            # 봇 댓글 생성
            bot_comment_text = bot_service.generate_bot_comment(bot_persona, context_text)
            
            bot_reply = Comment(
                post_id=parent_comment.post_id,
                user_id=None,  # 봇은 user_id가 없음
                parent_id=parent_comment_id,
                original_text=None,
                content=bot_comment_text,
                is_bot=True,
                bot_name=bot_persona['name']
            )
            
            db.session.add(bot_reply)
            db.session.commit()
            
    except Exception as e:
        print(f"봇 대댓글 생성 중 오류: {e}")
```

### 6. 게시물 생성 시 봇 댓글 자동 생성
```python
def create_bot_comments_for_post(post_id, post_text, ai_text):
    """게시물에 대한 봇 댓글 생성"""
    try:
        from app import create_app
        app = create_app()
        
        with app.app_context():
            # 봇 3개 선택
            selected_bots = random.sample(bot_service.bot_personas, min(3, len(bot_service.bot_personas)))
            context_text = ai_text if ai_text else post_text
            
            for bot in selected_bots:
                # 봇 댓글 생성
                bot_comment_text = bot_service.generate_bot_comment(bot, context_text)
                
                bot_comment = Comment(
                    post_id=post_id,
                    user_id=None,
                    parent_id=None,
                    original_text=None,
                    content=bot_comment_text,
                    is_bot=True,
                    bot_name=bot['name']
                )
                
                db.session.add(bot_comment)
            
            db.session.commit()
            
    except Exception as e:
        print(f"봇 댓글 생성 중 오류: {e}")
```

### 7. 댓글 JSON 변환
```python
def to_dict(self, include_replies=True):
    """댓글을 딕셔너리로 변환"""
    data = {
        'id': self.id,
        'post_id': self.post_id,
        'user_id': self.user_id,
        'parent_id': self.parent_id,
        'content': self.content,
        'original_text': self.original_text,
        'is_bot': self.is_bot,
        'bot_name': self.bot_name,
        'created_at': self.created_at.isoformat() if self.created_at else None,
    }
    
    # 사용자 정보 추가 (봇이 아닌 경우)
    if self.user:
        data['user'] = {
            'id': self.user.id,
            'nickname': self.user.nickname,
            'avatar': self.user.avatar
        }
    elif self.is_bot:
        # 봇인 경우 봇 정보 추가
        data['bot_info'] = {
            'name': self.bot_name,
            'emoji': self._get_bot_emoji()
        }
    
    # 대댓글 포함
    if include_replies and self.replies:
        data['replies'] = [reply.to_dict(include_replies=False) for reply in self.replies]
    
    return data
```

## 스레드 구조

### 1. 데이터베이스 구조
```
댓글 (parent_id = NULL)
├── 대댓글 1 (parent_id = 댓글.id)
├── 대댓글 2 (parent_id = 댓글.id)
└── 대댓글 3 (parent_id = 댓글.id)

댓글 2 (parent_id = NULL)
├── 대댓글 1 (parent_id = 댓글2.id)
└── 대댓글 2 (parent_id = 댓글2.id)
```

### 2. JSON 응답 구조
```json
{
    "comments": [
        {
            "id": 1,
            "content": "사용자 댓글입니다",
            "user": {
                "id": 1,
                "nickname": "사용자",
                "avatar": 1
            },
            "replies": [
                {
                    "id": 2,
                    "content": "와... 대단하네요! 저도 어렸을 때 그런 일을 했었는데...",
                    "is_bot": true,
                    "bot_info": {
                        "name": "하이프봇3000",
                        "emoji": "🤖"
                    }
                },
                {
                    "id": 3,
                    "content": "흥... 그게 뭐 대단한가요? 😤",
                    "is_bot": true,
                    "bot_info": {
                        "name": "질투AI",
                        "emoji": "😤"
                    }
                }
            ]
        }
    ]
}
```

## 봇 상호작용 시스템

### 1. 타이밍 시스템
- **게시물 작성**: 3-10초 후 봇 댓글 3개 생성
- **사용자 댓글**: 2-6초 후 봇 대댓글 2개 생성
- **지연 시간 차등**: 각 봇마다 1.5-2초씩 차이

### 2. 봇 선택 알고리즘
```python
# 게시물에 대한 댓글: 랜덤 3개 봇
selected_bots = random.sample(bot_personas, min(3, len(bot_personas)))

# 사용자 댓글에 대한 대댓글: 랜덤 2개 봇
selected_bots = random.sample(bot_personas, min(2, len(bot_personas)))
```

### 3. 컨텍스트 전달
- **게시물 댓글**: AI 변환 텍스트 우선, 없으면 원본 텍스트
- **대댓글**: 게시물의 AI 변환 텍스트 사용 (일관성 유지)

## API 엔드포인트

### 1. 댓글 생성
```http
POST /api/comments/
Authorization: Bearer {token}
Content-Type: application/json

{
    "post_id": 1,
    "content": "정말 대단한 성취네요!",
    "parent_id": null  // 최상위 댓글인 경우 null
}

# 응답 (201 Created)
{
    "message": "댓글이 생성되었습니다",
    "comment": {
        "id": 1,
        "post_id": 1,
        "content": "정말 대단한 성취네요!",
        "user": {
            "id": 1,
            "nickname": "사용자",
            "avatar": 1
        },
        "created_at": "2024-01-01T12:00:00"
    }
}
```

### 2. 댓글 목록 조회
```http
GET /api/comments/post/1

# 응답 (200 OK)
{
    "comments": [
        {
            "id": 1,
            "content": "사용자 댓글",
            "user": {...},
            "replies": [
                {
                    "id": 2,
                    "content": "와... 대단하네요! 저도 어렸을 때...",
                    "is_bot": true,
                    "bot_info": {
                        "name": "하이프봇3000",
                        "emoji": "🤖"
                    }
                }
            ]
        }
    ],
    "total": 1
}
```

### 3. 댓글 삭제
```http
DELETE /api/comments/1
Authorization: Bearer {token}

# 응답 (200 OK)
{
    "message": "댓글이 삭제되었습니다"
}
```

## 실시간 상호작용 플로우

### 1. 게시물 작성 시
```
1. 사용자가 게시물 작성
2. AI 텍스트 변환 완료
3. 3-10초 후 봇 댓글 3개 자동 생성
   - 하이프봇3000 (3초 후)
   - 질투AI (5초 후)  
   - 축하봇 (7초 후)
```

### 2. 사용자 댓글 작성 시
```
1. 사용자가 댓글 작성
2. 댓글 데이터베이스 저장
3. 2-6초 후 봇 대댓글 2개 자동 생성
   - 캡틴과장러 (2초 후)
   - 아첨꾼2.0 (3.5초 후)
```

### 3. 봇 댓글 내용 예시
**사용자 게시물**: "새로운 앱을 출시했습니다"

**봇 댓글들**:
- 🤖 하이프봇3000: "와... 대단하네요! 저도 어렸을 때 앱 개발을 했었는데, 전국 대회에서 우승했었죠 ㅎㅎ"
- 😤 질투AI: "흥... 그게 뭐 대단한가요? 저는 앱 개발을 훨씬 더 잘해요!"
- 🎉 축하봇: "🎉🎊 앱 출시 파티다아아! 모두 축하해주세요! 🥳"

## 에러 처리 및 안정성

### 1. 데이터베이스 제약조건
- **외래키 제약**: post_id, user_id, parent_id 유효성 검증
- **NOT NULL 제약**: 필수 필드 검증
- **CASCADE 삭제**: 게시물 삭제 시 관련 댓글 자동 삭제

### 2. 봇 댓글 생성 실패 처리
```python
try:
    # 봇 댓글 생성 로직
    pass
except Exception as e:
    print(f"봇 댓글 생성 중 오류: {e}")
    # 로그 기록 후 계속 진행 (다른 봇은 정상 작동)
```

### 3. 앱 컨텍스트 관리
```python
# Flask 앱 컨텍스트 설정 (백그라운드 스레드에서 필요)
from app import create_app
app = create_app()

with app.app_context():
    # 데이터베이스 작업
    pass
```

## 성능 최적화

### 1. 쿼리 최적화
```python
# 댓글과 대댓글을 한 번에 조회
comments = Comment.query.filter_by(post_id=post_id, parent_id=None)\
    .options(db.joinedload(Comment.replies))\
    .order_by(Comment.created_at.desc()).all()
```

### 2. 인덱스 설정
```sql
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
```

### 3. 메모리 효율성
- 불필요한 대댓글 재귀 로딩 방지
- 봇 페르소나 데이터 캐싱
- 타이머 리소스 적절한 정리

## 확장 가능성

### 1. 추가 기능
- **댓글 좋아요**: Like 모델과 연동
- **댓글 신고**: 부적절한 댓글 신고 기능
- **댓글 편집**: 사용자 댓글 수정 기능

### 2. 봇 고도화
- **감정 분석**: 게시물 감정에 따른 봇 반응
- **대화 기억**: 이전 댓글을 기억하는 봇
- **시간 기반**: 시간대에 따른 다른 반응

### 3. 실시간 기능
- **WebSocket**: 실시간 댓글 업데이트
- **알림 시스템**: 댓글 생성 시 알림
- **타이핑 인디케이터**: 봇이 댓글 작성 중임을 표시

## 학습 포인트

1. **스레드 구조**: 자기 참조 관계를 통한 계층적 데이터 모델링
2. **백그라운드 작업**: threading.Timer를 활용한 지연 실행
3. **소프트 삭제**: 데이터 무결성을 위한 논리적 삭제
4. **Flask 컨텍스트**: 백그라운드 스레드에서 Flask 앱 컨텍스트 사용
5. **JSON 직렬화**: 복잡한 관계형 데이터의 JSON 변환
6. **에러 처리**: 백그라운드 작업의 예외 처리
7. **데이터베이스 관계**: 다대일, 일대다, 자기참조 관계 설계

## 다음 단계 (STEP 12)
- React에서 댓글 UI 구현
- 스레드 구조 댓글 표시
- 실시간 댓글 업데이트 애니메이션
- 봇 댓글 구분 UI 및 인터랙션