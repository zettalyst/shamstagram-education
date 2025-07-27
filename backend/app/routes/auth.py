"""
인증 관련 라우트

로그인, 회원가입, 토큰 검증 등 인증 관련 엔드포인트를 제공합니다.
"""

from flask import Blueprint, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app import db
from app.models import User, Invitation
from app.services.auth_service import AuthService

# 블루프린트 생성
auth_bp = Blueprint('auth', __name__)

# Rate limiter 설정
limiter = Limiter(
    app=None,
    key_func=get_remote_address,
    storage_uri="memory://"
)


@auth_bp.route('/verify-invitation', methods=['POST'])
@limiter.limit("10 per minute")
def verify_invitation():
    """
    초대 토큰 검증
    
    초대 토큰이 유효한지 확인합니다.
    """
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


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    """
    회원가입
    
    초대 토큰과 함께 새 사용자를 등록합니다.
    """
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
    access_token = AuthService.create_access_token({'sub': user.id})
    
    return jsonify({
        'message': '회원가입이 완료되었습니다.',
        'access_token': access_token,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    """
    로그인
    
    이메일과 비밀번호로 로그인합니다.
    """
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': '이메일과 비밀번호가 필요합니다.'}), 400
    
    # 사용자 확인
    user = User.query.filter_by(email=email).first()
    
    if not user or not AuthService.verify_password(password, user.password_hash):
        return jsonify({'error': '이메일 또는 비밀번호가 올바르지 않습니다.'}), 401
    
    # 활성 사용자 확인
    if not user.is_active:
        return jsonify({'error': '비활성화된 계정입니다.'}), 403
    
    # JWT 토큰 생성
    access_token = AuthService.create_access_token({'sub': user.id})
    
    return jsonify({
        'message': '로그인되었습니다.',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200