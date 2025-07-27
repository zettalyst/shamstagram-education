"""
Flask 애플리케이션 팩토리

애플리케이션 인스턴스를 생성하고 설정을 적용합니다.
"""

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


# 확장(Extension) 인스턴스 생성
# 애플리케이션 팩토리 패턴에서는 확장을 전역으로 생성하고
# create_app 함수에서 초기화합니다
db = SQLAlchemy()
migrate = Migrate()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)


def create_app(config_class):
    """
    Flask 애플리케이션을 생성하고 설정합니다.
    
    Args:
        config_class: 사용할 설정 클래스
        
    Returns:
        Flask: 설정이 완료된 Flask 애플리케이션
    """
    
    # Flask 앱 생성
    app = Flask(__name__)
    
    # 설정 적용
    app.config.from_object(config_class)
    
    # 확장 초기화
    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    
    # CORS 설정 - 프론트엔드와의 통신을 위해 필요
    CORS(app, 
         origins=app.config.get('CORS_ORIGINS', ['*']),
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'])
    
    # 애플리케이션 컨텍스트에서 데이터베이스 테이블 생성
    with app.app_context():
        # 모든 모델 import (모델이 정의된 후에)
        from app import models  # noqa
        # 데이터베이스 테이블 생성
        db.create_all()
    
    # 블루프린트 등록
    from app.routes import main_bp, health_bp, auth_bp, posts_bp
    from app.routes.comments import comments_bp
    from app.routes.likes import likes_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp)  # /api/auth 접두사는 블루프린트에서 정의됨
    app.register_blueprint(posts_bp)  # /api/posts 접두사는 블루프린트에서 정의됨
    app.register_blueprint(comments_bp, url_prefix='/api')  # /api/comments 접두사
    app.register_blueprint(likes_bp, url_prefix='/api')  # /api/likes 접두사
    
    # 에러 핸들러 등록
    register_error_handlers(app)
    
    return app


def register_error_handlers(app):
    """
    전역 에러 핸들러를 등록합니다.
    
    Args:
        app: Flask 애플리케이션
    """
    
    @app.errorhandler(404)
    def not_found_error(error):
        """404 에러 처리"""
        return {'error': '요청한 리소스를 찾을 수 없습니다.'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """500 에러 처리"""
        return {'error': '서버 내부 오류가 발생했습니다.'}, 500
    
    @app.errorhandler(400)
    def bad_request_error(error):
        """400 에러 처리"""
        return {'error': '잘못된 요청입니다.'}, 400