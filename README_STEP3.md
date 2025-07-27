# Step 3: Database Models

SQLAlchemy를 사용하여 데이터베이스 모델을 정의합니다.

## 🎯 학습 목표

1. SQLAlchemy ORM 이해와 사용법
2. 데이터베이스 관계 설정 (1:N, N:M)
3. 모델 설계와 정규화
4. 마이그레이션 개념
5. 데이터베이스 초기화

## 📁 추가된 구조

```
backend/
├── app/
│   ├── __init__.py      # SQLAlchemy 초기화 추가
│   └── models/          # 데이터베이스 모델
│       ├── __init__.py  # 모델 export
│       ├── user.py      # 사용자 모델
│       ├── post.py      # 게시물 모델
│       ├── comment.py   # 댓글 모델
│       ├── like.py      # 좋아요 모델
│       └── invitation.py # 초대 모델
├── config/
│   └── __init__.py      # 데이터베이스 설정 추가
├── requirements.txt     # SQLAlchemy 의존성 추가
└── init_db.py          # 데이터베이스 초기화 스크립트
```

## 🔍 주요 개념 설명

### 1. SQLAlchemy ORM

ORM(Object-Relational Mapping)은 객체와 데이터베이스 테이블을 매핑합니다:

```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
```

### 2. 관계 설정

#### 1:N 관계 (One-to-Many)
```python
# User 모델에서
posts = db.relationship('Post', backref='author', lazy='dynamic')

# 사용법
user.posts  # 사용자의 모든 게시물
post.author  # 게시물의 작성자
```

#### N:M 관계 (Many-to-Many)
Like 테이블을 통한 User와 Post의 관계:
```python
# Like 모델이 중간 테이블 역할
user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
post_id = db.Column(db.Integer, db.ForeignKey('posts.id'))
```

#### 자기 참조 (Self-Referential)
Comment의 대댓글 구조:
```python
parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'))
replies = db.relationship('Comment', backref=db.backref('parent'))
```

### 3. 제약조건

#### Unique 제약조건
```python
email = db.Column(db.String(120), unique=True)
```

#### 복합 Unique 제약조건
```python
__table_args__ = (
    db.UniqueConstraint('user_id', 'post_id'),
)
```

### 4. 모델 메서드

#### 정적 메서드
```python
@staticmethod
def generate_token():
    return secrets.token_urlsafe(32)
```

#### 인스턴스 메서드
```python
def to_dict(self):
    return {'id': self.id, 'email': self.email}
```

## 📊 데이터베이스 스키마

```
users
├── id (PK)
├── email (unique)
├── nickname (unique)
├── password_hash
├── avatar
├── is_active
└── created_at

posts
├── id (PK)
├── user_id (FK → users.id)
├── original_text
├── ai_text
└── created_at

comments
├── id (PK)
├── post_id (FK → posts.id)
├── user_id (FK → users.id, nullable)
├── parent_id (FK → comments.id, nullable)
├── original_text
├── content
├── is_bot
├── bot_name
├── delay
└── created_at

likes
├── id (PK)
├── user_id (FK → users.id)
├── post_id (FK → posts.id)
├── created_at
└── UNIQUE(user_id, post_id)

invitations
├── id (PK)
├── email
├── token (unique)
├── is_used
├── user_id (FK → users.id, nullable)
├── used_at
└── created_at
```

## 🚀 실행 방법

1. 의존성 설치:
```bash
cd backend
pip install -r requirements.txt
```

2. 데이터베이스 초기화:
```bash
python init_db.py
```

3. 서버 실행하여 확인:
```bash
python run.py
```

## 💡 다음 단계

다음 브랜치(`4_frontend_foundation`)에서는:
- React + Vite + TypeScript 설정
- 라우터 구성
- Tailwind CSS + shadcn/ui 설정

## 🤔 생각해볼 문제

1. 왜 ORM을 사용하는가? 장단점은?
2. lazy='dynamic'의 의미는?
3. backref와 back_populates의 차이는?
4. 데이터베이스 정규화란?
5. 인덱스는 언제 필요한가?

## 📚 추가 학습 자료

- [SQLAlchemy 공식 문서](https://docs.sqlalchemy.org/)
- [Flask-SQLAlchemy 문서](https://flask-sqlalchemy.palletsprojects.com/)
- [데이터베이스 관계 이해하기](https://docs.sqlalchemy.org/en/20/orm/relationships.html)