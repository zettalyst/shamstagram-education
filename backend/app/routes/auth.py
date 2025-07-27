"""
인증 관련 라우트
로그인, 회원가입, 토큰 검증 등의 엔드포인트 제공
"""

from flask import Blueprint, request, jsonify
from app.models import User, Invitation
from app import db, limiter
from app.services.auth_service import AuthService, auth_required
import re

# Blueprint 생성
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def validate_email(email):
    """이메일 형식 검증"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """비밀번호 유효성 검증 (최소 6자)"""
    return len(password) >= 6


@auth_bp.route('/verify-invitation', methods=['POST'])
@limiter.limit("10 per minute")
def verify_invitation():
    """
    초대 토큰 검증
    
    Request Body:
        {
            "token": "invitation_token"
        }
    
    Returns:
        200: 토큰 유효
        400: 토큰 무효
    """
    try:
        data = request.get_json()
        token = data.get('token', '').strip()
        
        if not token:
            return jsonify({'error': '초대 토큰이 필요합니다.'}), 400
        
        # 특별 데모 토큰 확인
        if token == 'shamwow':
            return jsonify({
                'valid': True,
                'email': 'demo@example.com',
                'message': '데모 토큰이 확인되었습니다.'
            }), 200
        
        # 데이터베이스에서 토큰 확인
        invitation = Invitation.query.filter_by(token=token, is_used=False).first()
        
        if not invitation:
            return jsonify({'error': '유효하지 않은 초대 토큰입니다.'}), 400
        
        return jsonify({
            'valid': True,
            'email': invitation.email,
            'message': '초대 토큰이 확인되었습니다.'
        }), 200
        
    except Exception as e:
        return jsonify({'error': '토큰 검증 중 오류가 발생했습니다.'}), 500


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")  # 분당 5회 제한
def register():
    """
    회원가입 엔드포인트 (초대 토큰 기반)
    
    Request Body:
        {
            "token": "invitation_token",
            "nickname": "사용자닉네임",
            "password": "password123",
            "avatar": 1
        }
    
    Returns:
        201: 회원가입 성공 (토큰 포함)
        400: 잘못된 요청 (유효성 검증 실패)
        409: 닉네임 중복
    """
    try:
        data = request.get_json()
        
        # 필수 필드 확인
        required_fields = ['token', 'nickname', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field}이(가) 필요합니다.'}), 400
        
        token = data.get('token').strip()
        nickname = data.get('nickname').strip()
        password = data.get('password')
        avatar = data.get('avatar', 1)
        
        # 닉네임 길이 확인
        if len(nickname) < 2 or len(nickname) > 20:
            return jsonify({'error': '닉네임은 2-20자 사이여야 합니다.'}), 400
        
        # 비밀번호 길이 확인
        if len(password) < 6:
            return jsonify({'error': '비밀번호는 최소 6자 이상이어야 합니다.'}), 400
        
        # 닉네임 중복 확인
        if User.query.filter_by(nickname=nickname).first():
            return jsonify({'error': '이미 사용 중인 닉네임입니다.'}), 400
        
        # 초대 토큰 확인
        email = None
        invitation = None
        
        if token == 'shamwow':
            # 데모 토큰
            email = f"demo_{nickname}@example.com"
        else:
            # 일반 초대 토큰
            invitation = Invitation.query.filter_by(token=token, is_used=False).first()
            if not invitation:
                return jsonify({'error': '유효하지 않은 초대 토큰입니다.'}), 400
            email = invitation.email
        
        # 이메일 중복 확인
        if User.query.filter_by(email=email).first():
            return jsonify({'error': '이미 가입된 이메일입니다.'}), 400
        
        # 사용자 생성
        user = User(
            email=email,
            nickname=nickname,
            password_hash=AuthService.hash_password(password),
            avatar=avatar
        )
        
        db.session.add(user)
        
        # 초대 토큰 사용 처리
        if invitation:
            invitation.use(user)
        
        db.session.commit()
        
        # JWT 토큰 생성
        access_token = AuthService.generate_token(user.id)
        
        return jsonify({
            'message': '회원가입이 완료되었습니다.',
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'nickname': user.nickname,
                'avatar': user.avatar
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '회원가입 처리 중 오류가 발생했습니다'}), 500


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")  # 분당 10회 제한
def login():
    """
    로그인 엔드포인트
    
    Request Body:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    
    Returns:
        200: 로그인 성공 (토큰 포함)
        400: 잘못된 요청
        401: 인증 실패
    """
    try:
        data = request.get_json()
        
        # 필수 필드 확인
        if not all(k in data for k in ('email', 'password')):
            return jsonify({'error': '이메일과 비밀번호를 입력해주세요'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # 사용자 조회
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': '이메일 또는 비밀번호가 일치하지 않습니다'}), 401
        
        # 비밀번호 검증
        if not AuthService.verify_password(password, user.password_hash):
            return jsonify({'error': '이메일 또는 비밀번호가 일치하지 않습니다'}), 401
        
        # 활성 사용자 확인
        if not user.is_active:
            return jsonify({'error': '비활성화된 계정입니다'}), 401
        
        # 토큰 생성
        token = AuthService.generate_token(user.id)
        
        return jsonify({
            'message': '로그인 성공',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'nickname': user.nickname,
                'avatar': user.avatar
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': '로그인 처리 중 오류가 발생했습니다'}), 500


@auth_bp.route('/me', methods=['GET'])
@auth_required
def get_current_user():
    """
    현재 로그인한 사용자 정보 조회
    
    Headers:
        Authorization: Bearer {token}
    
    Returns:
        200: 사용자 정보
        401: 인증 실패
        404: 사용자 없음
    """
    try:
        # auth_required 데코레이터가 request.user_id를 설정함
        user = User.query.get(request.user_id)
        
        if not user:
            return jsonify({'error': '사용자를 찾을 수 없습니다'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'nickname': user.nickname,
                'avatar': user.avatar,
                'created_at': user.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': '사용자 정보 조회 중 오류가 발생했습니다'}), 500


@auth_bp.route('/verify', methods=['GET'])
@auth_required
def verify_token():
    """
    토큰 유효성 검증
    
    Headers:
        Authorization: Bearer {token}
    
    Returns:
        200: 토큰 유효
        401: 토큰 무효
    """
    return jsonify({
        'valid': True,
        'user_id': request.user_id
    }), 200