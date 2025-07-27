"""
좋아요 관련 API 라우트
"""
from flask import Blueprint, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app.models.like import Like
from app.models.post import Post
from app.services.auth_service import auth_required
from app import db
import logging

# 블루프린트 생성
likes_bp = Blueprint('likes', __name__)

# Rate limiter 설정
limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)


@likes_bp.route('/posts/<int:post_id>/like', methods=['POST'])
@auth_required
@limiter.limit("60 per minute")
def toggle_like(post_id, current_user):
    """게시물 좋아요 토글"""
    try:
        # 포스트 존재 확인
        post = Post.query.get_or_404(post_id)
        
        # 현재 좋아요 상태 확인
        existing_like = Like.query.filter_by(
            user_id=current_user.id,
            post_id=post_id
        ).first()
        
        if existing_like:
            # 이미 좋아요한 경우 - 좋아요 취소
            db.session.delete(existing_like)
            is_liked = False
            message = '좋아요를 취소했습니다'
        else:
            # 좋아요하지 않은 경우 - 좋아요 추가
            new_like = Like(
                user_id=current_user.id,
                post_id=post_id
            )
            db.session.add(new_like)
            is_liked = True
            message = '좋아요를 눌렀습니다'
        
        db.session.commit()
        
        # 총 좋아요 수 계산
        total_likes = Like.query.filter_by(post_id=post_id).count()
        
        return jsonify({
            'message': message,
            'is_liked': is_liked,
            'like_count': total_likes
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"좋아요 토글 실패: {e}")
        return jsonify({'error': '좋아요 처리에 실패했습니다'}), 500


@likes_bp.route('/posts/<int:post_id>/likes', methods=['GET'])
def get_post_likes(post_id):
    """게시물의 좋아요 목록 조회"""
    try:
        # 포스트 존재 확인
        post = Post.query.get_or_404(post_id)
        
        # 좋아요 목록 조회 (최신순)
        likes = Like.query.filter_by(post_id=post_id)\
                         .order_by(Like.created_at.desc())\
                         .all()
        
        # 응답 데이터 구성
        likes_data = []
        for like in likes:
            if like.user:  # 사용자가 존재하는 경우만
                likes_data.append({
                    'id': like.id,
                    'user': {
                        'id': like.user.id,
                        'nickname': like.user.nickname,
                        'avatar': like.user.avatar
                    },
                    'created_at': like.created_at.isoformat()
                })
        
        return jsonify({
            'likes': likes_data,
            'total': len(likes_data)
        })
        
    except Exception as e:
        logger.error(f"좋아요 목록 조회 실패: {e}")
        return jsonify({'error': '좋아요 목록을 불러올 수 없습니다'}), 500


@likes_bp.route('/users/<int:user_id>/likes', methods=['GET'])
@auth_required
def get_user_likes(user_id, current_user):
    """사용자가 좋아요한 게시물 목록 조회"""
    try:
        # 본인 또는 공개된 정보만 조회 (현재는 모든 사용자 정보 공개)
        # 페이지네이션 파라미터
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 10, type=int), 50)
        
        # 사용자가 좋아요한 게시물 조회
        likes_query = Like.query.filter_by(user_id=user_id)\
                              .order_by(Like.created_at.desc())
        
        # 페이지네이션 적용
        paginated = likes_query.paginate(
            page=page,
            per_page=limit,
            error_out=False
        )
        
        # 응답 데이터 구성
        liked_posts = []
        for like in paginated.items:
            if like.post and like.post.author:  # 게시물과 작성자가 존재하는 경우만
                liked_posts.append({
                    'like_id': like.id,
                    'liked_at': like.created_at.isoformat(),
                    'post': {
                        'id': like.post.id,
                        'original_text': like.post.original_text,
                        'ai_text': like.post.ai_text,
                        'created_at': like.post.created_at.isoformat(),
                        'author': {
                            'id': like.post.author.id,
                            'nickname': like.post.author.nickname,
                            'avatar': like.post.author.avatar
                        }
                    }
                })
        
        return jsonify({
            'liked_posts': liked_posts,
            'pagination': {
                'page': paginated.page,
                'pages': paginated.pages,
                'per_page': paginated.per_page,
                'total': paginated.total,
                'has_prev': paginated.has_prev,
                'has_next': paginated.has_next
            }
        })
        
    except Exception as e:
        logger.error(f"사용자 좋아요 목록 조회 실패: {e}")
        return jsonify({'error': '좋아요 목록을 불러올 수 없습니다'}), 500