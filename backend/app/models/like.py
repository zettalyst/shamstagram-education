"""
좋아요 모델

사용자가 게시물에 누른 좋아요 정보를 저장하는 테이블을 정의합니다.
"""

from datetime import datetime, timezone
from app import db


class Like(db.Model):
    """좋아요 모델"""
    
    __tablename__ = 'likes'
    
    # 기본 키
    id = db.Column(db.Integer, primary_key=True)
    
    # 사용자 (User 테이블과 연결)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # 게시물 (Post 테이블과 연결)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    
    # 좋아요 누른 시간
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # 복합 유니크 제약조건 - 한 사용자가 같은 게시물에 중복 좋아요 방지
    __table_args__ = (
        db.UniqueConstraint('user_id', 'post_id', name='unique_user_post_like'),
    )
    
    def __repr__(self):
        """객체를 문자열로 표현"""
        return f'<Like User:{self.user_id} -> Post:{self.post_id}>'
    
    def to_dict(self):
        """
        좋아요 정보를 딕셔너리로 변환
        
        Returns:
            dict: 좋아요 정보 딕셔너리
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'post_id': self.post_id,
            'created_at': self.created_at.isoformat() + 'Z'
        }