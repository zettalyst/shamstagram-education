"""
사용자 모델 (스텁)
교육용 프로젝트 - 11단계에서는 기본 구조만 제공
"""

from app.models import db
from datetime import datetime

class User(db.Model):
    """사용자 모델"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    nickname = db.Column(db.String(50), unique=True, nullable=False)
    avatar = db.Column(db.Integer, default=1)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)