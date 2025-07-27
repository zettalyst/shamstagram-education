"""
댓글 모델

게시물에 대한 댓글 정보를 저장하는 테이블을 정의합니다.
봇 댓글과 사용자 댓글을 모두 저장할 수 있습니다.
"""

from datetime import datetime, timezone
from app import db


class Comment(db.Model):
    """댓글 모델"""
    
    __tablename__ = 'comments'
    
    # 기본 키
    id = db.Column(db.Integer, primary_key=True)
    
    # 게시물 (Post 테이블과 연결)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    
    # 작성자 (User 테이블과 연결) - 봇 댓글의 경우 NULL
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # 부모 댓글 (대댓글 기능을 위해) - 자기 참조
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)
    
    # 댓글 내용
    original_text = db.Column(db.Text, nullable=True)  # 사용자가 입력한 원본 (봇은 NULL)
    content = db.Column(db.Text, nullable=False)  # 실제 표시되는 댓글 내용
    
    # 봇 관련 정보
    is_bot = db.Column(db.Boolean, default=False)  # 봇 댓글 여부
    bot_name = db.Column(db.String(50), nullable=True)  # 봇 이름 (봇인 경우)
    delay = db.Column(db.Integer, default=0)  # 표시 지연 시간 (밀리초)
    
    # 메타데이터
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # 관계 설정 - 대댓글들 (자기 참조)
    replies = db.relationship(
        'Comment',
        backref=db.backref('parent', remote_side=[id]),
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    def __repr__(self):
        """객체를 문자열로 표현"""
        if self.is_bot:
            return f'<Comment {self.id} by Bot:{self.bot_name}>'
        return f'<Comment {self.id} by User:{self.user_id}>'
    
    def to_dict(self, include_replies=False):
        """
        댓글 정보를 딕셔너리로 변환
        
        Args:
            include_replies (bool): 대댓글 포함 여부
            
        Returns:
            dict: 댓글 정보 딕셔너리
        """
        data = {
            'id': self.id,
            'post_id': self.post_id,
            'parent_id': self.parent_id,
            'content': self.content,
            'is_bot': self.is_bot,
            'created_at': self.created_at.isoformat() + 'Z'
        }
        
        # 봇 댓글인 경우
        if self.is_bot:
            data['bot_name'] = self.bot_name
            data['delay'] = self.delay
        else:
            # 사용자 댓글인 경우
            data['original_text'] = self.original_text
            if self.author:
                data['author'] = {
                    'id': self.author.id,
                    'nickname': self.author.nickname,
                    'avatar': self.author.avatar
                }
        
        # 대댓글 포함
        if include_replies:
            data['replies'] = [reply.to_dict() for reply in self.replies]
        
        return data