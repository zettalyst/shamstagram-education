"""
사용자 모델

사용자 정보를 저장하는 테이블을 정의합니다.
STEP 13: 좋아요 관계 추가
"""

from datetime import datetime, timezone
from app import db


class User(db.Model):
    """사용자 모델"""
    
    __tablename__ = 'users'
    
    # 기본 키
    id = db.Column(db.Integer, primary_key=True)
    
    # 사용자 정보
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    nickname = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # 프로필 정보
    avatar = db.Column(db.Integer, default=1)  # 1-5 사이의 아바타 번호
    
    # 계정 상태
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # 관계 설정 - 사용자가 작성한 게시물들
    # backref='author'를 통해 Post 모델에서 post.author로 접근 가능
    posts = db.relationship('Post', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    
    # 관계 설정 - 사용자가 작성한 댓글들
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    
    # 관계 설정 - 사용자의 좋아요들
    likes = db.relationship('Like', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    # 관계 설정 - 사용자가 사용한 초대
    used_invitation = db.relationship('Invitation', backref='used_by', uselist=False)
    
    def __repr__(self):
        """객체를 문자열로 표현"""
        return f'<User {self.nickname}>'
    
    def to_dict(self):
        """
        사용자 정보를 딕셔너리로 변환
        
        Returns:
            dict: 사용자 정보 딕셔너리
        """
        return {
            'id': self.id,
            'email': self.email,
            'nickname': self.nickname,
            'avatar': self.avatar,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() + 'Z',
            'post_count': self.posts.count(),
            'comment_count': self.comments.count()
        }