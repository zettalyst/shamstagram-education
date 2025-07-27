"""
인증 서비스

JWT 토큰 생성 및 검증, 비밀번호 해싱 등 인증 관련 기능을 제공합니다.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext
from flask import current_app


class AuthService:
    """인증 관련 서비스"""
    
    # 비밀번호 해싱을 위한 설정
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    @classmethod
    def hash_password(cls, password: str) -> str:
        """
        비밀번호를 해시화합니다.
        
        Args:
            password: 평문 비밀번호
            
        Returns:
            str: 해시화된 비밀번호
        """
        return cls.pwd_context.hash(password)
    
    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        """
        비밀번호를 검증합니다.
        
        Args:
            plain_password: 평문 비밀번호
            hashed_password: 해시화된 비밀번호
            
        Returns:
            bool: 비밀번호 일치 여부
        """
        return cls.pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: Dict[str, Any]) -> str:
        """
        JWT 액세스 토큰을 생성합니다.
        
        Args:
            data: 토큰에 포함할 데이터
            
        Returns:
            str: JWT 토큰
        """
        to_encode = data.copy()
        
        # 만료 시간 설정 (24시간)
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
        to_encode.update({"exp": expire})
        
        # JWT 토큰 생성
        encoded_jwt = jwt.encode(
            to_encode,
            current_app.config['JWT_SECRET_KEY'],
            algorithm=current_app.config.get('JWT_ALGORITHM', 'HS256')
        )
        
        return encoded_jwt
    
    @staticmethod
    def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
        """
        JWT 토큰을 디코드합니다.
        
        Args:
            token: JWT 토큰
            
        Returns:
            dict: 토큰 페이로드 또는 None
        """
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=[current_app.config.get('JWT_ALGORITHM', 'HS256')]
            )
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def get_current_user_id(token: str) -> Optional[int]:
        """
        토큰에서 현재 사용자 ID를 추출합니다.
        
        Args:
            token: JWT 토큰
            
        Returns:
            int: 사용자 ID 또는 None
        """
        payload = AuthService.decode_access_token(token)
        if payload:
            return payload.get('sub')  # subject (user_id)
        return None