"""
좋아요 기능 API 라우트
STEP 13: 좋아요 토글 및 조회 기능
"""

from flask import Blueprint, request, jsonify
from app import db
from app.models.like import Like
from app.models.post import Post
from flask_jwt_extended import jwt_required, get_jwt_identity
import jwt

likes_bp = Blueprint('likes', __name__)

@likes_bp.route('/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    """
    게시물 좋아요 토글
    - 이미 좋아요를 눌렀다면 취소
    - 좋아요를 누르지 않았다면 추가
    """
    user_id = get_jwt_identity()
    
    # 게시물 존재 확인
    post = Post.query.get_or_404(post_id)
    
    # 이미 좋아요를 눌렀는지 확인
    existing_like = Like.query.filter_by(
        user_id=user_id,
        post_id=post_id
    ).first()
    
    if existing_like:
        # 좋아요 취소
        db.session.delete(existing_like)
        liked = False
    else:
        # 좋아요 추가
        new_like = Like(user_id=user_id, post_id=post_id)
        db.session.add(new_like)
        liked = True
    
    db.session.commit()
    
    # 현재 좋아요 수 계산
    like_count = Like.query.filter_by(post_id=post_id).count()
    
    return jsonify({
        'success': True,
        'liked': liked,
        'like_count': like_count,
        'message': '좋아요를 눌렀습니다.' if liked else '좋아요를 취소했습니다.'
    })

@likes_bp.route('/posts/<int:post_id>/likes', methods=['GET'])
def get_likes(post_id):
    """
    게시물의 좋아요 정보 조회
    - 총 좋아요 수
    - 현재 사용자가 좋아요를 눌렀는지 여부 (로그인한 경우)
    """
    # 게시물 존재 확인
    post = Post.query.get_or_404(post_id)
    
    # 총 좋아요 수
    like_count = Like.query.filter_by(post_id=post_id).count()
    
    # 현재 사용자의 좋아요 여부 확인 (토큰이 있는 경우만)
    liked = False
    if 'Authorization' in request.headers:
        try:
            # 토큰에서 사용자 ID 추출 (auth_required 없이)
            import jwt
            from flask import current_app
            
            token = request.headers.get('Authorization').replace('Bearer ', '')
            payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            user_id = payload['user_id']
            
            existing_like = Like.query.filter_by(
                user_id=user_id,
                post_id=post_id
            ).first()
            liked = existing_like is not None
        except:
            # 토큰이 유효하지 않거나 없는 경우 liked는 False 유지
            pass
    
    return jsonify({
        'success': True,
        'like_count': like_count,
        'liked': liked
    })

@likes_bp.route('/posts/<int:post_id>/likes/users', methods=['GET'])
@jwt_required()
def get_like_users(post_id):
    """
    게시물에 좋아요를 누른 사용자 목록 조회
    """
    # 게시물 존재 확인
    post = Post.query.get_or_404(post_id)
    
    # 좋아요를 누른 사용자들 조회 (최근 순)
    likes = db.session.query(Like).join(
        Like.user  # user 관계가 있다고 가정
    ).filter(
        Like.post_id == post_id
    ).order_by(
        Like.created_at.desc()
    ).limit(50).all()  # 최대 50명까지
    
    users = []
    for like in likes:
        users.append({
            'id': like.user.id,
            'nickname': like.user.nickname,
            'avatar': like.user.avatar,
            'liked_at': like.created_at.isoformat()
        })
    
    return jsonify({
        'success': True,
        'users': users,
        'total_count': Like.query.filter_by(post_id=post_id).count()
    })