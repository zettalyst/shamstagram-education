"""
사용자 관련 라우트

사용자 프로필, 통계 등을 제공합니다.
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from app import db
from app.models import User
from app.services.auth_service import AuthService

# 블루프린트 생성
users_bp = Blueprint('users', __name__)


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


@users_bp.route('/me', methods=['GET'])
@auth_required
def get_current_user():
    """현재 로그인한 사용자 정보를 가져옵니다."""
    return jsonify(request.current_user.to_dict()), 200


@users_bp.route('/me', methods=['PUT'])
@auth_required
def update_current_user():
    """현재 사용자 정보를 업데이트합니다."""
    data = request.get_json()
    
    # 업데이트 가능한 필드
    if 'nickname' in data:
        nickname = data['nickname'].strip()
        
        # 닉네임 유효성 검사
        if len(nickname) < 2 or len(nickname) > 20:
            return jsonify({'error': '닉네임은 2-20자 사이여야 합니다.'}), 400
        
        # 중복 확인 (자신 제외)
        existing_user = User.query.filter(
            User.nickname == nickname,
            User.id != request.current_user.id
        ).first()
        
        if existing_user:
            return jsonify({'error': '이미 사용 중인 닉네임입니다.'}), 400
        
        request.current_user.nickname = nickname
    
    if 'avatar' in data:
        avatar = data['avatar']
        if avatar < 1 or avatar > 5:
            return jsonify({'error': '아바타는 1-5 사이의 값이어야 합니다.'}), 400
        
        request.current_user.avatar = avatar
    
    db.session.commit()
    
    return jsonify({
        'message': '프로필이 업데이트되었습니다.',
        'user': request.current_user.to_dict()
    }), 200


@users_bp.route('/me/posts', methods=['GET'])
@auth_required
def get_my_posts():
    """현재 사용자의 게시물 목록을 가져옵니다."""
    posts = request.current_user.posts.order_by(Post.created_at.desc()).all()
    
    result = []
    for post in posts:
        post_dict = post.to_dict()
        post_dict['is_liked'] = True  # 자신의 게시물
        post_dict['is_owner'] = True
        result.append(post_dict)
    
    return jsonify(result), 200


@users_bp.route('/stats', methods=['GET'])
@auth_required
def get_user_stats():
    """전체 사용자 통계를 가져옵니다."""
    total_users = User.query.count()
    total_posts = db.session.query(Post).count()
    total_comments = db.session.query(Comment).count()
    
    # 상위 사용자 (게시물 수 기준)
    top_users = db.session.query(
        User.nickname,
        User.avatar,
        db.func.count(Post.id).label('post_count')
    ).join(Post).group_by(User.id).order_by(
        db.func.count(Post.id).desc()
    ).limit(5).all()
    
    return jsonify({
        'total_users': total_users,
        'total_posts': total_posts,
        'total_comments': total_comments,
        'top_users': [
            {
                'nickname': user.nickname,
                'avatar': user.avatar,
                'post_count': user.post_count
            }
            for user in top_users
        ]
    }), 200


# 필요한 모델 import (상단에 추가해야 하지만 여기서는 함수 내에서 처리)
from app.models import Post, Comment