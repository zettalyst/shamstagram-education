"""
Flask 애플리케이션 팩토리

애플리케이션 인스턴스를 생성하고 설정을 적용합니다.
"""

from flask import Flask
from flask_cors import CORS


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
    
    # CORS 설정 - 프론트엔드와의 통신을 위해 필요
    CORS(app, 
         origins=app.config.get('CORS_ORIGINS', ['*']),
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'])
    
    # 블루프린트 등록
    from app.routes import main_bp, health_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(health_bp, url_prefix='/api')
    
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