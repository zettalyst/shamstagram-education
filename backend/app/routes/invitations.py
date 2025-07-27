"""
초대 시스템 API 라우트

이 모듈은 초대 토큰 생성, 검증, 관리를 위한 API 엔드포인트를 제공합니다.
- 관리자가 초대 토큰을 생성할 수 있습니다
- 초대 토큰을 통해 회원가입 링크를 생성할 수 있습니다
- 초대 토큰의 사용 상태를 추적할 수 있습니다
"""

from flask import Blueprint, request, jsonify
from app.models import db
from app.models.invitation import Invitation
from app.models.user import User
from app.utils.decorators import auth_required
import secrets
import string
from datetime import datetime

invitations_bp = Blueprint('invitations', __name__)

def generate_invitation_token():
    """초대 토큰 생성 함수
    
    Returns:
        str: 16자리 랜덤 영숫자 토큰
    """
    # 16자리 영숫자 토큰 생성
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(16))

@invitations_bp.route('/create', methods=['POST'])
@auth_required
def create_invitation():
    """초대 토큰 생성 API
    
    관리자(또는 인증된 사용자)가 새로운 초대 토큰을 생성합니다.
    
    Request Body:
        {
            "email": "user@example.com"  # 초대할 이메일 주소
        }
    
    Returns:
        {
            "success": true,
            "invitation": {
                "id": 1,
                "email": "user@example.com",
                "token": "abc123def456ghi789",
                "is_used": false,
                "created_at": "2024-01-01T00:00:00"
            },
            "invitation_link": "http://localhost:8080/signup?token=abc123def456ghi789"
        }
    """
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({
                'success': False,
                'message': '이메일 주소가 필요합니다'
            }), 400
        
        # 이미 회원가입된 이메일인지 확인
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({
                'success': False,
                'message': '이미 가입된 이메일 주소입니다'
            }), 400
        
        # 이미 초대가 존재하는지 확인 (사용되지 않은 것만)
        existing_invitation = Invitation.query.filter_by(
            email=email, 
            is_used=False
        ).first()
        
        if existing_invitation:
            return jsonify({
                'success': False,
                'message': '이미 초대가 발송된 이메일 주소입니다'
            }), 400
        
        # 새로운 초대 토큰 생성
        token = generate_invitation_token()
        
        # 토큰 중복 방지 (매우 낮은 확률이지만)
        while Invitation.query.filter_by(token=token).first():
            token = generate_invitation_token()
        
        # 초대 정보 저장
        invitation = Invitation(
            email=email,
            token=token
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        # 초대 링크 생성 (프론트엔드 URL)
        invitation_link = f"http://localhost:8080/signup?token={token}"
        
        return jsonify({
            'success': True,
            'invitation': {
                'id': invitation.id,
                'email': invitation.email,
                'token': invitation.token,
                'is_used': invitation.is_used,
                'created_at': invitation.created_at.isoformat()
            },
            'invitation_link': invitation_link
        }), 201
        
    except Exception as e:
        print(f"초대 생성 오류: {e}")
        return jsonify({
            'success': False,
            'message': '초대 생성 중 오류가 발생했습니다'
        }), 500

@invitations_bp.route('/verify/<token>', methods=['GET'])
def verify_invitation(token):
    """초대 토큰 검증 API
    
    회원가입 페이지에서 토큰의 유효성을 확인합니다.
    
    Args:
        token (str): 검증할 초대 토큰
    
    Returns:
        {
            "success": true,
            "invitation": {
                "id": 1,
                "email": "user@example.com",
                "is_used": false,
                "created_at": "2024-01-01T00:00:00"
            }
        }
    """
    try:
        invitation = Invitation.query.filter_by(token=token).first()
        
        if not invitation:
            return jsonify({
                'success': False,
                'message': '유효하지 않은 초대 토큰입니다'
            }), 404
        
        if invitation.is_used:
            return jsonify({
                'success': False,
                'message': '이미 사용된 초대 토큰입니다'
            }), 400
        
        return jsonify({
            'success': True,
            'invitation': {
                'id': invitation.id,
                'email': invitation.email,
                'is_used': invitation.is_used,
                'created_at': invitation.created_at.isoformat()
            }
        })
        
    except Exception as e:
        print(f"초대 토큰 검증 오류: {e}")
        return jsonify({
            'success': False,
            'message': '토큰 검증 중 오류가 발생했습니다'
        }), 500

@invitations_bp.route('/use/<token>', methods=['POST'])
def use_invitation(token):
    """초대 토큰 사용 처리 API
    
    회원가입이 완료되면 토큰을 사용 처리합니다.
    
    Args:
        token (str): 사용할 초대 토큰
    
    Request Body:
        {
            "user_id": 1  # 가입한 사용자 ID
        }
    
    Returns:
        {
            "success": true,
            "message": "초대 토큰이 성공적으로 사용되었습니다"
        }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': '사용자 ID가 필요합니다'
            }), 400
        
        invitation = Invitation.query.filter_by(token=token).first()
        
        if not invitation:
            return jsonify({
                'success': False,
                'message': '유효하지 않은 초대 토큰입니다'
            }), 404
        
        if invitation.is_used:
            return jsonify({
                'success': False,
                'message': '이미 사용된 초대 토큰입니다'
            }), 400
        
        # 토큰 사용 처리
        invitation.is_used = True
        invitation.user_id = user_id
        invitation.used_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '초대 토큰이 성공적으로 사용되었습니다'
        })
        
    except Exception as e:
        print(f"초대 토큰 사용 오류: {e}")
        return jsonify({
            'success': False,
            'message': '토큰 사용 처리 중 오류가 발생했습니다'
        }), 500

@invitations_bp.route('/list', methods=['GET'])
@auth_required
def list_invitations():
    """초대 목록 조회 API
    
    관리자가 모든 초대의 상태를 확인할 수 있습니다.
    
    Query Parameters:
        - page: 페이지 번호 (기본값: 1)
        - per_page: 페이지당 항목 수 (기본값: 10)
        - status: 필터링할 상태 ('used', 'unused', 'all') (기본값: 'all')
    
    Returns:
        {
            "success": true,
            "invitations": [...],
            "pagination": {
                "page": 1,
                "per_page": 10,
                "total": 25,
                "pages": 3
            }
        }
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status_filter = request.args.get('status', 'all')
        
        # 페이지당 항목 수 제한 (1-50)
        per_page = max(1, min(per_page, 50))
        
        # 기본 쿼리
        query = Invitation.query
        
        # 상태 필터링
        if status_filter == 'used':
            query = query.filter_by(is_used=True)
        elif status_filter == 'unused':
            query = query.filter_by(is_used=False)
        # 'all'인 경우 필터링하지 않음
        
        # 최신순으로 정렬
        query = query.order_by(Invitation.created_at.desc())
        
        # 페이지네이션 적용
        paginated = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # 초대 목록 직렬화
        invitations = []
        for invitation in paginated.items:
            invitation_data = {
                'id': invitation.id,
                'email': invitation.email,
                'token': invitation.token,
                'is_used': invitation.is_used,
                'created_at': invitation.created_at.isoformat(),
                'used_at': invitation.used_at.isoformat() if invitation.used_at else None
            }
            
            # 사용된 초대인 경우 사용자 정보 추가
            if invitation.is_used and invitation.user_id:
                user = User.query.get(invitation.user_id)
                if user:
                    invitation_data['user'] = {
                        'id': user.id,
                        'nickname': user.nickname,
                        'email': user.email
                    }
            
            invitations.append(invitation_data)
        
        return jsonify({
            'success': True,
            'invitations': invitations,
            'pagination': {
                'page': paginated.page,
                'per_page': paginated.per_page,
                'total': paginated.total,
                'pages': paginated.pages
            }
        })
        
    except Exception as e:
        print(f"초대 목록 조회 오류: {e}")
        return jsonify({
            'success': False,
            'message': '초대 목록 조회 중 오류가 발생했습니다'
        }), 500

@invitations_bp.route('/delete/<int:invitation_id>', methods=['DELETE'])
@auth_required
def delete_invitation(invitation_id):
    """초대 삭제 API
    
    관리자가 초대를 삭제할 수 있습니다. (사용되지 않은 초대만)
    
    Args:
        invitation_id (int): 삭제할 초대 ID
    
    Returns:
        {
            "success": true,
            "message": "초대가 성공적으로 삭제되었습니다"
        }
    """
    try:
        invitation = Invitation.query.get(invitation_id)
        
        if not invitation:
            return jsonify({
                'success': False,
                'message': '초대를 찾을 수 없습니다'
            }), 404
        
        if invitation.is_used:
            return jsonify({
                'success': False,
                'message': '사용된 초대는 삭제할 수 없습니다'
            }), 400
        
        db.session.delete(invitation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '초대가 성공적으로 삭제되었습니다'
        })
        
    except Exception as e:
        print(f"초대 삭제 오류: {e}")
        return jsonify({
            'success': False,
            'message': '초대 삭제 중 오류가 발생했습니다'
        }), 500