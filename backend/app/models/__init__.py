"""
데이터베이스 모델 패키지

SQLAlchemy를 사용하여 데이터베이스 테이블을 정의합니다.
"""

# 모든 모델을 여기서 import하여 한 곳에서 관리
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.models.like import Like
from app.models.invitation import Invitation

# 다른 모듈에서 쉽게 import할 수 있도록 export
__all__ = ['User', 'Post', 'Comment', 'Like', 'Invitation']