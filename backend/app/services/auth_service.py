"""
인증 서비스 모듈
JWT 토큰 생성/검증 및 비밀번호 해싱 기능 제공
"""

import jwt
from datetime import datetime, timedelta, timezone
from passlib.hash import bcrypt
from flask import current_app
from functools import wraps
from flask import request, jsonify


class AuthService:
    """인증 관련 기능을 제공하는 서비스 클래스"""
    
    @staticmethod
    def hash_password(password):
        """
        비밀번호를 bcrypt로 해싱
        
        Args:
            password (str): 평문 비밀번호
            
        Returns:
            str: 해싱된 비밀번호
        """
        return bcrypt.hash(password)
    
    @staticmethod
    def verify_password(password, hashed):
        """
        비밀번호 검증
        
        Args:
            password (str): 평문 비밀번호
            hashed (str): 해싱된 비밀번호
            
        Returns:
            bool: 일치 여부
        """
        return bcrypt.verify(password, hashed)
    
    @staticmethod
    def generate_token(user_id):
        """
        JWT 토큰 생성
        
        Args:
            user_id (int): 사용자 ID
            
        Returns:
            str: JWT 토큰
        """
        payload = {
            'user_id': user_id,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24),  # 24시간 유효
            'iat': datetime.now(timezone.utc)
        }
        
        # JWT_SECRET_KEY 설정이 있으면 사용, 없으면 SECRET_KEY 사용
        secret_key = current_app.config.get('JWT_SECRET_KEY', current_app.config['SECRET_KEY'])
        
        return jwt.encode(payload, secret_key, algorithm='HS256')
    
    @staticmethod
    def decode_token(token):
        """
        JWT 토큰 디코딩
        
        Args:
            token (str): JWT 토큰
            
        Returns:
            dict: 디코딩된 페이로드
            
        Raises:
            jwt.ExpiredSignatureError: 토큰 만료
            jwt.InvalidTokenError: 유효하지 않은 토큰
        """
        secret_key = current_app.config.get('JWT_SECRET_KEY', current_app.config['SECRET_KEY'])
        
        return jwt.decode(token, secret_key, algorithms=['HS256'])


def auth_required(f):
    """
    인증이 필요한 엔드포인트를 위한 데코레이터
    
    Usage:
        @auth_required
        def protected_route():
            user_id = request.user_id
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Authorization 헤더에서 토큰 추출
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': '인증이 필요합니다'}), 401
        
        # Bearer 토큰 형식 확인
        try:
            token_type, token = auth_header.split(' ')
            if token_type.lower() != 'bearer':
                return jsonify({'error': '유효하지 않은 토큰 형식입니다'}), 401
        except ValueError:
            return jsonify({'error': '유효하지 않은 토큰 형식입니다'}), 401
        
        # 토큰 검증
        try:
            payload = AuthService.decode_token(token)
            request.user_id = payload['user_id']  # request 객체에 user_id 추가
        except jwt.ExpiredSignatureError:
            return jsonify({'error': '토큰이 만료되었습니다'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': '유효하지 않은 토큰입니다'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function