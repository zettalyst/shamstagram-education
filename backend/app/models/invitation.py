"""
초대 모델

프라이빗 SNS를 위한 초대 토큰 정보를 저장하는 테이블을 정의합니다.
"""

import secrets
from datetime import datetime, timezone
from app import db


class Invitation(db.Model):
    """초대 모델"""
    
    __tablename__ = 'invitations'
    
    # 기본 키
    id = db.Column(db.Integer, primary_key=True)
    
    # 초대 정보
    email = db.Column(db.String(120), nullable=False)  # 초대받을 이메일
    token = db.Column(db.String(100), unique=True, nullable=False, index=True)  # 초대 토큰
    
    # 사용 정보
    is_used = db.Column(db.Boolean, default=False)  # 사용 여부
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # 사용한 사용자
    used_at = db.Column(db.DateTime, nullable=True)  # 사용 시간
    
    # 메타데이터
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def __repr__(self):
        """객체를 문자열로 표현"""
        status = 'Used' if self.is_used else 'Unused'
        return f'<Invitation {self.email} - {status}>'
    
    @staticmethod
    def generate_token():
        """
        안전한 랜덤 토큰 생성
        
        Returns:
            str: 32바이트 URL-safe 토큰
        """
        return secrets.token_urlsafe(32)
    
    def use(self, user):
        """
        초대 토큰 사용 처리
        
        Args:
            user (User): 토큰을 사용한 사용자
        """
        self.is_used = True
        self.user_id = user.id
        self.used_at = datetime.now(timezone.utc)
    
    def to_dict(self):
        """
        초대 정보를 딕셔너리로 변환
        
        Returns:
            dict: 초대 정보 딕셔너리
        """
        data = {
            'id': self.id,
            'email': self.email,
            'token': self.token,
            'is_used': self.is_used,
            'created_at': self.created_at.isoformat() + 'Z'
        }
        
        if self.is_used:
            data['used_at'] = self.used_at.isoformat() + 'Z'
            if self.used_by:
                data['used_by'] = {
                    'id': self.used_by.id,
                    'nickname': self.used_by.nickname
                }
        
        return data