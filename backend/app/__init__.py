"""
Flask 애플리케이션 팩토리
교육용 프로젝트 - 11단계: Comments Backend
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.models import db, init_models
from app.routes import comments
import os

def create_app(config_name='development'):
    """Flask 애플리케이션 생성
    
    Args:
        config_name: 설정 이름
        
    Returns:
        Flask: Flask 애플리케이션 인스턴스
    """
    app = Flask(__name__)
    
    # 기본 설정
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///shamstagram.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 확장 초기화
    db.init_app(app)
    CORS(app, origins=['http://localhost:8080'])
    JWTManager(app)
    
    # 모델 초기화
    with app.app_context():
        init_models()
        db.create_all()
    
    # 블루프린트 등록
    app.register_blueprint(comments.bp)
    
    # 기본 라우트
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'service': 'shamstagram-backend'}, 200
    
    return app