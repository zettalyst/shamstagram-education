"""
게시물 모델 (스텁)
교육용 프로젝트 - 11단계에서는 기본 구조만 제공
"""

from app.models import db
from datetime import datetime

class Post(db.Model):
    """게시물 모델"""
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    original_text = db.Column(db.Text, nullable=False)
    ai_text = db.Column(db.Text, nullable=True)
    likes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 관계 설정
    user = db.relationship('User', backref=db.backref('posts', lazy='dynamic'))