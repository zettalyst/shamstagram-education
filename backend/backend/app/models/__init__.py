"""
모델 패키지 초기화
교육용 프로젝트 - 11단계: Comments Backend
"""

from flask_sqlalchemy import SQLAlchemy

# SQLAlchemy 인스턴스 생성
db = SQLAlchemy()

# 모델 임포트 (순환 참조 방지를 위해 함수 내에서 임포트)
def init_models():
    """모든 모델 초기화"""
    from app.models.user import User
    from app.models.post import Post
    from app.models.comment import Comment
    from app.models.invitation import Invitation
    from app.models.like import Like
    
    return User, Post, Comment, Invitation, Like