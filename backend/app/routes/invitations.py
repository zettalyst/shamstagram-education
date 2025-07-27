"""
초대 관련 라우트

초대 토큰 생성 및 관리 기능을 제공합니다.
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from app import db
from app.models import User, Invitation
from app.services.auth_service import AuthService

# 블루프린트 생성
invitations_bp = Blueprint('invitations', __name__)


def auth_required(f):
    """인증이 필요한 엔드포인트를 위한 데코레이터"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': '인증이 필요합니다.'}), 401
        
        user_id = AuthService.get_current_user_id(token)
        if not user_id:
            return jsonify({'error': '유효하지 않은 토큰입니다.'}), 401
        
        # 사용자 확인
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({'error': '사용자를 찾을 수 없습니다.'}), 401
        
        # request에 현재 사용자 정보 추가
        request.current_user = user
        return f(*args, **kwargs)
    return decorated_function


@invitations_bp.route('', methods=['GET'])
@auth_required
def get_invitations():
    """모든 초대 목록을 가져옵니다."""
    # 모든 초대 조회 (최신순)
    invitations = Invitation.query.order_by(Invitation.created_at.desc()).all()
    
    return jsonify([inv.to_dict() for inv in invitations]), 200


@invitations_bp.route('', methods=['POST'])
@auth_required
def create_invitation():
    """새 초대를 생성합니다."""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({'error': '이메일이 필요합니다.'}), 400
    
    # 이메일 형식 간단 검증
    if '@' not in email or '.' not in email.split('@')[1]:
        return jsonify({'error': '올바른 이메일 형식이 아닙니다.'}), 400
    
    # 이미 가입한 이메일인지 확인
    if User.query.filter_by(email=email).first():
        return jsonify({'error': '이미 가입된 이메일입니다.'}), 400
    
    # 이미 초대된 이메일인지 확인 (사용하지 않은 초대만)
    existing_invitation = Invitation.query.filter_by(
        email=email,
        is_used=False
    ).first()
    
    if existing_invitation:
        return jsonify({'error': '이미 초대장이 발송된 이메일입니다.'}), 400
    
    # 최대 초대 수 확인
    max_invitations = current_app.config.get('MAX_INVITATIONS', 10)
    total_users = User.query.count()
    pending_invitations = Invitation.query.filter_by(is_used=False).count()
    
    if total_users + pending_invitations >= max_invitations:
        return jsonify({'error': f'최대 {max_invitations}명까지만 초대할 수 있습니다.'}), 400
    
    # 초대 생성
    invitation = Invitation(
        email=email,
        token=Invitation.generate_token()
    )
    
    db.session.add(invitation)
    db.session.commit()
    
    # 초대 URL 생성
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
    invitation_url = f"{frontend_url}/?token={invitation.token}"
    
    return jsonify({
        'message': '초대장이 생성되었습니다.',
        'invitation': invitation.to_dict(),
        'invitation_url': invitation_url
    }), 201


@invitations_bp.route('/stats', methods=['GET'])
@auth_required
def get_invitation_stats():
    """초대 통계를 가져옵니다."""
    total_invitations = Invitation.query.count()
    used_invitations = Invitation.query.filter_by(is_used=True).count()
    pending_invitations = Invitation.query.filter_by(is_used=False).count()
    total_users = User.query.count()
    max_invitations = current_app.config.get('MAX_INVITATIONS', 10)
    
    return jsonify({
        'total_invitations': total_invitations,
        'used_invitations': used_invitations,
        'pending_invitations': pending_invitations,
        'total_users': total_users,
        'max_invitations': max_invitations,
        'remaining_slots': max(0, max_invitations - total_users)
    }), 200


# Flask app import
from flask import current_app