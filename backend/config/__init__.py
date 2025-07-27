"""
Flask 애플리케이션 설정 모듈

환경별로 다른 설정을 관리합니다.
개발(Development)과 프로덕션(Production) 환경을 구분합니다.
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()


class Config:
    """기본 설정 클래스"""
    
    # 보안 키 - 세션 쿠키 암호화에 사용
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-key-change-in-production')
    
    # JWT 설정
    JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    
    # CORS 설정 - 프론트엔드 URL 허용
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8080')
    
    # 데이터베이스 설정
    # SQLite를 기본으로 사용 (개발 및 학습 목적)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///shamstagram.db'  # 기본값: SQLite
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # 성능 향상을 위해 비활성화
    
    # OpenAI API 설정
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    
    # 앱 설정
    MAX_INVITATIONS = int(os.getenv('MAX_INVITATIONS', 10))
    AI_BOT_COUNT = int(os.getenv('AI_BOT_COUNT', 5))
    AI_COMMENT_DELAY_MIN = int(os.getenv('AI_COMMENT_DELAY_MIN', 3000))
    AI_COMMENT_DELAY_MAX = int(os.getenv('AI_COMMENT_DELAY_MAX', 10000))
    
    # 기본 설정
    JSON_SORT_KEYS = False  # JSON 응답 키 정렬 비활성화
    

class DevelopmentConfig(Config):
    """개발 환경 설정"""
    
    DEBUG = True
    TESTING = False
    
    # 개발 환경에서는 여러 포트 허용
    CORS_ORIGINS = [
        'http://localhost:8080',
        'http://localhost:5173',  # Vite 기본 포트
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5173'
    ]


class ProductionConfig(Config):
    """프로덕션 환경 설정"""
    
    DEBUG = False
    TESTING = False
    
    # 프로덕션에서는 설정된 프론트엔드 URL만 허용
    CORS_ORIGINS = [Config.FRONTEND_URL]
    
    # 프로덕션 보안 설정
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'


# 환경별 설정 매핑
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}