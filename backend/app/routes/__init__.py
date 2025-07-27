"""
라우트 패키지

기본 라우트와 헬스체크 라우트를 제공합니다.
"""

from flask import Blueprint, jsonify

# 기본 라우트 블루프린트
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """메인 페이지"""
    return jsonify({
        'message': 'Shamstagram API Server',
        'version': '1.0.0',
        'status': 'running'
    })

# 헬스체크 라우트 블루프린트  
health_bp = Blueprint('health', __name__)

@health_bp.route('/health')
def health_check():
    """헬스체크 엔드포인트"""
    return jsonify({
        'status': 'healthy',
        'service': 'shamstagram-api'
    })