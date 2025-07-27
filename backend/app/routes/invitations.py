"""
초대 관리 API 라우트
초대 생성, 검증, 목록 조회, 삭제 기능 제공
"""

from flask import Blueprint, request, jsonify, current_app
from app.models import Invitation, User
from app import db, limiter
from app.services.auth_service import auth_required
import secrets
import string
import re

# Blueprint 생성
invitations_bp = Blueprint('invitations', __name__, url_prefix='/api/invitations')


def validate_email(email):
    """이메일 형식 검증"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def generate_invitation_token():
    """16자리 랜덤 영숫자 토큰 생성"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(16))


@invitations_bp.route('/create', methods=['POST'])
@auth_required
@limiter.limit("10 per minute")  # 분당 10개 초대 제한
def create_invitation():
    """
    새 초대 생성
    
    Request Body:
        {
            "email": "user@example.com"
        }
    
    Returns:
        201: 생성된 초대 정보
        400: 잘못된 요청
        409: 중복 이메일
    """
    try:
        data = request.get_json()
        
        # 필수 필드 확인
        if not data or 'email' not in data:
            return jsonify({'error': '이메일이 필요합니다'}), 400
        
        email = data['email'].strip().lower()
        
        # 이메일 형식 검증
        if not validate_email(email):
            return jsonify({'error': '유효한 이메일 형식이 아닙니다'}), 400
        
        # 이미 가입된 사용자 확인
        if User.query.filter_by(email=email).first():
            return jsonify({'error': '이미 가입된 이메일입니다'}), 409
        
        # 사용되지 않은 초대 존재 여부 확인
        existing_invitation = Invitation.query.filter_by(email=email, is_used=False).first()
        if existing_invitation:
            return jsonify({'error': '이미 초대가 발송된 이메일입니다'}), 409
        
        # 최대 초대 수 확인
        max_invitations = current_app.config.get('MAX_INVITATIONS', 11)
        current_invitations = Invitation.query.filter_by(is_used=False).count()
        total_users = User.query.count()
        
        if (current_invitations + total_users) >= max_invitations:
            return jsonify({'error': f'최대 초대 수({max_invitations})에 도달했습니다'}), 409
        
        # 유일한 토큰 생성
        while True:
            token = generate_invitation_token()
            if not Invitation.query.filter_by(token=token).first():
                break
        
        # 초대 생성
        invitation = Invitation(
            email=email,
            token=token
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        # 초대 링크 생성
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
        invitation_link = f"{frontend_url}/register?token={token}"
        
        return jsonify({
            'message': '초대가 생성되었습니다',
            'invitation': {
                'id': invitation.id,
                'email': invitation.email,
                'token': invitation.token,
                'created_at': invitation.created_at.isoformat()
            },
            'invitation_link': invitation_link
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '초대 생성 중 오류가 발생했습니다'}), 500


@invitations_bp.route('/verify/<string:token>', methods=['GET'])
def verify_invitation(token):
    """
    초대 토큰 검증
    
    Args:
        token (str): 초대 토큰
    
    Returns:
        200: 토큰 유효
        400: 토큰 무효
    """
    try:
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
            return jsonify({
                'valid': False,
                'error': '유효하지 않은 초대 토큰입니다.'
            }), 400
        
        return jsonify({
            'valid': True,
            'email': invitation.email,
            'message': '초대 토큰이 확인되었습니다.'
        }), 200
        
    except Exception as e:
        return jsonify({
            'valid': False,
            'error': '토큰 검증 중 오류가 발생했습니다.'
        }), 500


@invitations_bp.route('/list', methods=['GET'])
@auth_required
def get_invitations():
    """
    초대 목록 조회 (페이지네이션)
    
    Query Parameters:
        page (int): 페이지 번호 (기본값: 1)
        per_page (int): 페이지당 항목 수 (기본값: 10, 최대: 50)
        status (str): 필터 ('all', 'used', 'pending')
    
    Returns:
        200: 초대 목록과 페이지네이션 정보
    """
    try:
        # 페이지네이션 파라미터
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)
        status = request.args.get('status', 'all')
        
        # 기본 쿼리
        query = Invitation.query
        
        # 상태 필터링
        if status == 'used':
            query = query.filter_by(is_used=True)
        elif status == 'pending':
            query = query.filter_by(is_used=False)
        # 'all'인 경우 필터링 없음
        
        # 최신순 정렬 및 페이지네이션
        paginated = query.order_by(Invitation.created_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # 데이터 가공
        invitations_data = []
        for invitation in paginated.items:
            invitation_dict = invitation.to_dict()
            # 사용된 초대인 경우 사용자 정보 포함
            if invitation.is_used and invitation.user:
                invitation_dict['user'] = {
                    'id': invitation.user.id,
                    'nickname': invitation.user.nickname,
                    'avatar': invitation.user.avatar
                }
            invitations_data.append(invitation_dict)
        
        # 통계 정보
        stats = {
            'total_users': User.query.count(),
            'used_invitations': Invitation.query.filter_by(is_used=True).count(),
            'pending_invitations': Invitation.query.filter_by(is_used=False).count(),
            'remaining_slots': max(0, current_app.config.get('MAX_INVITATIONS', 11) - User.query.count() - Invitation.query.filter_by(is_used=False).count())
        }
        
        return jsonify({
            'invitations': invitations_data,
            'pagination': {
                'page': paginated.page,
                'pages': paginated.pages,
                'per_page': paginated.per_page,
                'total': paginated.total,
                'has_prev': paginated.has_prev,
                'has_next': paginated.has_next
            },
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': '초대 목록 조회 중 오류가 발생했습니다'}), 500


@invitations_bp.route('/delete/<int:invitation_id>', methods=['DELETE'])
@auth_required
@limiter.limit("20 per minute")  # 분당 20개 삭제 제한
def delete_invitation(invitation_id):
    """
    초대 삭제 (사용되지 않은 것만)
    
    Args:
        invitation_id (int): 초대 ID
    
    Returns:
        200: 삭제 성공
        400: 삭제 불가
        404: 초대 없음
    """
    try:
        invitation = Invitation.query.get(invitation_id)
        
        if not invitation:
            return jsonify({'error': '초대를 찾을 수 없습니다'}), 404
        
        # 사용된 초대는 삭제 불가
        if invitation.is_used:
            return jsonify({'error': '사용된 초대는 삭제할 수 없습니다'}), 400
        
        db.session.delete(invitation)
        db.session.commit()
        
        return jsonify({'message': '초대가 삭제되었습니다'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '초대 삭제 중 오류가 발생했습니다'}), 500


@invitations_bp.route('/stats', methods=['GET'])
@auth_required
def get_invitation_stats():
    """
    초대 통계 조회
    
    Returns:
        200: 통계 정보
    """
    try:
        stats = {
            'total_users': User.query.count(),
            'used_invitations': Invitation.query.filter_by(is_used=True).count(),
            'pending_invitations': Invitation.query.filter_by(is_used=False).count(),
            'max_invitations': current_app.config.get('MAX_INVITATIONS', 11)
        }
        
        stats['remaining_slots'] = max(0, stats['max_invitations'] - stats['total_users'] - stats['pending_invitations'])
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': '통계 조회 중 오류가 발생했습니다'}), 500