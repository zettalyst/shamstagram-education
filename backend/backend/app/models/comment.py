"""
댓글 모델 정의
교육용 프로젝트 - 11단계: Comments Backend
"""

from datetime import datetime
from app.models import db

class Comment(db.Model):
    """댓글 모델 - 스레드 구조 지원"""
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # 봇은 user_id가 없음
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)  # 대댓글을 위한 부모 댓글 ID
    
    # 댓글 내용
    original_text = db.Column(db.Text, nullable=True)  # 사용자가 입력한 원본 텍스트
    content = db.Column(db.Text, nullable=False)  # 표시될 댓글 내용 (봇 댓글 또는 AI 변환 텍스트)
    
    # 봇 댓글 관련
    bot_name = db.Column(db.String(50), nullable=True)  # 봇 이름 (봇 댓글인 경우)
    is_bot = db.Column(db.Boolean, default=False)  # 봇 댓글 여부
    delay = db.Column(db.Integer, nullable=True)  # 봇 댓글 지연 시간 (초)
    
    # 타임스탬프
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 관계 설정
    post = db.relationship('Post', backref=db.backref('comments', lazy='dynamic', cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('comments', lazy='dynamic'))
    
    # 자기 참조 관계 (대댓글)
    replies = db.relationship(
        'Comment',
        backref=db.backref('parent', remote_side=[id]),
        cascade='all, delete-orphan'
    )
    
    def to_dict(self, include_replies=True):
        """댓글을 딕셔너리로 변환
        
        Args:
            include_replies: 대댓글 포함 여부
            
        Returns:
            dict: 댓글 정보 딕셔너리
        """
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
    
    def _get_bot_emoji(self):
        """봇 이름에 따른 이모지 반환"""
        bot_emojis = {
            '하이프봇3000': '🤖',
            '질투AI': '😤',
            '캡틴과장러': '📊',
            '아첨꾼2.0': '✨',
            '축하봇': '🎉',
            '의심킹': '🤔'
        }
        return bot_emojis.get(self.bot_name, '🤖')
    
    def __repr__(self):
        return f'<Comment {self.id} by {"Bot:" + self.bot_name if self.is_bot else "User:" + str(self.user_id)}>'