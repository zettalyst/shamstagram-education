"""
게시물 모델

사용자가 작성한 게시물 정보를 저장하는 테이블을 정의합니다.
"""

from datetime import datetime, timezone
from app import db


class Post(db.Model):
    """게시물 모델"""
    
    __tablename__ = 'posts'
    
    # 기본 키
    id = db.Column(db.Integer, primary_key=True)
    
    # 작성자 (User 테이블과 연결)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # 게시물 내용
    original_text = db.Column(db.Text, nullable=False)  # 사용자가 입력한 원본 텍스트
    ai_text = db.Column(db.Text, nullable=False)  # AI가 변환한 과장된 텍스트
    
    # 메타데이터
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # 관계 설정 - 게시물의 댓글들
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    
    # 관계 설정 - 게시물의 좋아요들
    likes = db.relationship('Like', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        """객체를 문자열로 표현"""
        return f'<Post {self.id} by {self.author.nickname}>'
    
    def to_dict(self, include_author=True):
        """
        게시물 정보를 딕셔너리로 변환
        
        Args:
            include_author (bool): 작성자 정보 포함 여부
            
        Returns:
            dict: 게시물 정보 딕셔너리
        """
        data = {
            'id': self.id,
            'original_text': self.original_text,
            'ai_text': self.ai_text,
            'created_at': self.created_at.isoformat() + 'Z',
            'like_count': self.likes.count(),
            'comment_count': self.comments.count()
        }
        
        if include_author:
            data['author'] = {
                'id': self.author.id,
                'nickname': self.author.nickname,
                'avatar': self.author.avatar
            }
        
        return data