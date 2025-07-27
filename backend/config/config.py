"""
애플리케이션 설정 모듈

환경에 따른 다양한 설정을 관리합니다.
"""

import os
from datetime import timedelta


class Config:
    """기본 설정 클래스"""
    
    # 기본 설정
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    
    # 데이터베이스 설정
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # SQLAlchemy 변경 추적 비활성화 (성능 향상)
    
    # CORS 설정
    CORS_ORIGINS = ['http://localhost:8080', 'http://localhost:5173']
    
    # Rate Limiting 설정
    RATELIMIT_STORAGE_URL = "memory://"  # 메모리 기반 저장소
    
    # JWT 설정
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)  # 토큰 유효기간 24시간
    
    @staticmethod
    def init_app(app):
        """애플리케이션 초기화 시 실행할 작업"""
        pass


class DevelopmentConfig(Config):
    """개발 환경 설정"""
    
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///shamstagram_dev.db'
    
    # 개발 환경에서는 모든 origin 허용
    CORS_ORIGINS = ['*']


class TestingConfig(Config):
    """테스트 환경 설정"""
    
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'sqlite:///shamstagram_test.db'
    
    # 테스트 환경에서는 rate limiting 비활성화
    RATELIMIT_ENABLED = False


class ProductionConfig(Config):
    """프로덕션 환경 설정"""
    
    DEBUG = False
    
    # 프로덕션에서는 환경 변수에서 데이터베이스 URL을 가져옴
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    # 프로덕션에서는 보안을 위해 특정 origin만 허용
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
    
    @classmethod
    def init_app(cls, app):
        """프로덕션 환경 초기화"""
        Config.init_app(app)
        
        # 프로덕션에서 필수 환경 변수 확인
        if not os.environ.get('SECRET_KEY'):
            raise ValueError('SECRET_KEY 환경 변수가 설정되지 않았습니다.')
        if not os.environ.get('DATABASE_URL'):
            raise ValueError('DATABASE_URL 환경 변수가 설정되지 않았습니다.')


# 환경별 설정 매핑
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}