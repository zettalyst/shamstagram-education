"""
커스텀 데코레이터
교육용 프로젝트 - 11단계: Comments Backend
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def auth_required(f):
    """인증이 필요한 엔드포인트를 위한 데코레이터"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': '인증이 필요합니다'}), 401
    return decorated_function