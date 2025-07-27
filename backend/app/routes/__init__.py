"""
라우트 모듈

애플리케이션의 모든 라우트를 관리합니다.
"""

from flask import Blueprint, jsonify

# 메인 블루프린트 - 기본 라우트
main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def home():
    """
    홈 라우트
    
    Returns:
        dict: 환영 메시지
    """
    return jsonify({
        'message': 'Shamstagram API에 오신 것을 환영합니다!',
        'version': '1.0.0',
        'endpoints': {
            '/': '현재 페이지',
            '/api/health': '서버 상태 확인'
        }
    })


@main_bp.route('/api')
def api_info():
    """
    API 정보 라우트
    
    Returns:
        dict: API 정보
    """
    return jsonify({
        'name': 'Shamstagram API',
        'version': '1.0.0',
        'description': 'AI 기반 과장 SNS 백엔드 API'
    })


# 헬스체크 블루프린트 - 서버 상태 확인용
health_bp = Blueprint('health', __name__)


@health_bp.route('/health')
def health_check():
    """
    헬스체크 엔드포인트
    
    서버가 정상적으로 작동하는지 확인합니다.
    
    Returns:
        dict: 서버 상태 정보
    """
    return jsonify({
        'status': 'healthy',
        'message': '서버가 정상적으로 작동 중입니다.'
    }), 200