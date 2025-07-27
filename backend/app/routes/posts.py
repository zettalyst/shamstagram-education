"""
게시물 관련 라우트
게시물 CRUD 및 페이지네이션 기능 제공
"""

from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from app.models import Post, User, Like
from app import db, limiter
from app.services.auth_service import auth_required
from app.services.ai_service import get_ai_service
from app.services.bot_service import bot_service
from datetime import datetime
import random
import logging

logger = logging.getLogger(__name__)

# Blueprint 생성
posts_bp = Blueprint('posts', __name__, url_prefix='/api/posts')


@posts_bp.route('', methods=['GET'])
@auth_required
def get_posts():
    """
    게시물 목록 조회 (페이지네이션 포함)
    
    Query Parameters:
        page (int): 페이지 번호 (기본값: 1)
        limit (int): 페이지당 항목 수 (기본값: 10, 최대: 50)
    
    Returns:
        200: 게시물 목록과 페이지네이션 정보
    """
    try:
        # 페이지네이션 파라미터
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 10, type=int), 50)  # 최대 50개
        
        # 게시물 쿼리 (최신순)
        posts_query = Post.query.order_by(desc(Post.created_at))
        
        # 페이지네이션 적용
        paginated = posts_query.paginate(
            page=page,
            per_page=limit,
            error_out=False
        )
        
        # 현재 사용자가 좋아요한 게시물 ID 목록
        liked_post_ids = db.session.query(Like.post_id).filter_by(
            user_id=request.user_id
        ).all()
        liked_post_ids = [id[0] for id in liked_post_ids]
        
        # 게시물 데이터 가공
        posts_data = []
        for post in paginated.items:
            # 작성자 정보 포함
            author = User.query.get(post.user_id)
            posts_data.append({
                'id': post.id,
                'original_text': post.original_text,
                'ai_text': post.ai_text,
                'likes': post.likes,
                'created_at': post.created_at.isoformat(),
                'is_liked': post.id in liked_post_ids,
                'author': {
                    'id': author.id,
                    'nickname': author.nickname,
                    'avatar': author.avatar
                } if author else None
            })
        
        return jsonify({
            'posts': posts_data,
            'pagination': {
                'page': paginated.page,
                'pages': paginated.pages,
                'per_page': paginated.per_page,
                'total': paginated.total,
                'has_prev': paginated.has_prev,
                'has_next': paginated.has_next
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': '게시물 목록 조회 중 오류가 발생했습니다'}), 500


@posts_bp.route('/<int:post_id>', methods=['GET'])
@auth_required
def get_post(post_id):
    """
    특정 게시물 조회
    
    Args:
        post_id (int): 게시물 ID
    
    Returns:
        200: 게시물 상세 정보
        404: 게시물 없음
    """
    try:
        post = Post.query.get(post_id)
        
        if not post:
            return jsonify({'error': '게시물을 찾을 수 없습니다'}), 404
        
        # 작성자 정보
        author = User.query.get(post.user_id)
        
        # 현재 사용자가 좋아요했는지 확인
        is_liked = Like.query.filter_by(
            user_id=request.user_id,
            post_id=post_id
        ).first() is not None
        
        return jsonify({
            'post': {
                'id': post.id,
                'original_text': post.original_text,
                'ai_text': post.ai_text,
                'likes': post.likes,
                'created_at': post.created_at.isoformat(),
                'is_liked': is_liked,
                'author': {
                    'id': author.id,
                    'nickname': author.nickname,
                    'avatar': author.avatar
                } if author else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': '게시물 조회 중 오류가 발생했습니다'}), 500


@posts_bp.route('', methods=['POST'])
@auth_required
@limiter.limit("5 per minute")  # 분당 5개 게시물 제한
def create_post():
    """
    새 게시물 작성
    
    Request Body:
        {
            "text": "게시물 내용"
        }
    
    Returns:
        201: 생성된 게시물
        400: 잘못된 요청
    """
    try:
        data = request.get_json()
        
        # 필수 필드 확인
        if not data or 'text' not in data:
            return jsonify({'error': '게시물 내용을 입력해주세요'}), 400
        
        text = data['text'].strip()
        
        # 게시물 길이 검증 (최소 1자, 최대 500자)
        if len(text) < 1 or len(text) > 500:
            return jsonify({'error': '게시물은 1-500자 사이여야 합니다'}), 400
        
        # AI 서비스를 사용하여 텍스트 변환
        ai_service = get_ai_service()
        ai_text = ai_service.transform_text(text)
        
        # 변환 검증
        if not ai_service.validate_transformation(text, ai_text):
            # 변환이 실패한 경우 원본 텍스트에 간단한 수식어 추가
            ai_text = f"놀라운 소식! {text}"
        
        # 게시물 생성
        post = Post(
            user_id=request.user_id,
            original_text=text,
            ai_text=ai_text,  # AI 변환된 텍스트 사용
            likes=random.randint(50000, 2000000)  # 데모용 초기 좋아요 수
        )
        
        db.session.add(post)
        db.session.commit()
        
        # 봇 댓글 스케줄링
        try:
            bot_service.schedule_bot_comments(
                post_id=post.id,
                post_content=ai_text,
                original_text=text
            )
        except Exception as e:
            logger.warning(f"봇 댓글 스케줄링 실패: {e}")
        
        # 작성자 정보
        author = User.query.get(request.user_id)
        
        return jsonify({
            'message': '게시물이 작성되었습니다',
            'post': {
                'id': post.id,
                'original_text': post.original_text,
                'ai_text': post.ai_text,
                'likes': post.likes,
                'created_at': post.created_at.isoformat(),
                'is_liked': False,
                'author': {
                    'id': author.id,
                    'nickname': author.nickname,
                    'avatar': author.avatar
                } if author else None
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '게시물 작성 중 오류가 발생했습니다'}), 500


@posts_bp.route('/<int:post_id>', methods=['PUT'])
@auth_required
def update_post(post_id):
    """
    게시물 수정
    
    Args:
        post_id (int): 게시물 ID
    
    Request Body:
        {
            "text": "수정된 내용"
        }
    
    Returns:
        200: 수정된 게시물
        403: 권한 없음
        404: 게시물 없음
    """
    try:
        post = Post.query.get(post_id)
        
        if not post:
            return jsonify({'error': '게시물을 찾을 수 없습니다'}), 404
        
        # 작성자 확인
        if post.user_id != request.user_id:
            return jsonify({'error': '게시물을 수정할 권한이 없습니다'}), 403
        
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': '수정할 내용을 입력해주세요'}), 400
        
        text = data['text'].strip()
        
        # 게시물 길이 검증
        if len(text) < 1 or len(text) > 500:
            return jsonify({'error': '게시물은 1-500자 사이여야 합니다'}), 400
        
        # AI 서비스를 사용하여 텍스트 변환
        ai_service = get_ai_service()
        ai_text = ai_service.transform_text(text)
        
        # 변환 검증
        if not ai_service.validate_transformation(text, ai_text):
            # 변환이 실패한 경우 원본 텍스트에 간단한 수식어 추가
            ai_text = f"놀라운 소식! {text}"
        
        # 게시물 업데이트
        post.original_text = text
        post.ai_text = ai_text  # AI 변환된 텍스트 사용
        
        db.session.commit()
        
        # 작성자 정보
        author = User.query.get(post.user_id)
        
        # 좋아요 여부 확인
        is_liked = Like.query.filter_by(
            user_id=request.user_id,
            post_id=post_id
        ).first() is not None
        
        return jsonify({
            'message': '게시물이 수정되었습니다',
            'post': {
                'id': post.id,
                'original_text': post.original_text,
                'ai_text': post.ai_text,
                'likes': post.likes,
                'created_at': post.created_at.isoformat(),
                'is_liked': is_liked,
                'author': {
                    'id': author.id,
                    'nickname': author.nickname,
                    'avatar': author.avatar
                } if author else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '게시물 수정 중 오류가 발생했습니다'}), 500


@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@auth_required
def delete_post(post_id):
    """
    게시물 삭제
    
    Args:
        post_id (int): 게시물 ID
    
    Returns:
        200: 삭제 성공
        403: 권한 없음
        404: 게시물 없음
    """
    try:
        post = Post.query.get(post_id)
        
        if not post:
            return jsonify({'error': '게시물을 찾을 수 없습니다'}), 404
        
        # 작성자 확인
        if post.user_id != request.user_id:
            return jsonify({'error': '게시물을 삭제할 권한이 없습니다'}), 403
        
        # 관련 좋아요와 댓글도 자동으로 삭제됨 (cascade 설정에 의해)
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': '게시물이 삭제되었습니다'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '게시물 삭제 중 오류가 발생했습니다'}), 500


@posts_bp.route('/<int:post_id>/regenerate', methods=['POST'])
@auth_required
def regenerate_ai_text(post_id):
    """
    게시물의 AI 텍스트 재생성
    
    Args:
        post_id (int): 게시물 ID
    
    Returns:
        200: 재생성된 AI 텍스트
        403: 권한 없음
        404: 게시물 없음
    """
    try:
        post = Post.query.get(post_id)
        
        if not post:
            return jsonify({'error': '게시물을 찾을 수 없습니다'}), 404
        
        # 작성자 확인
        if post.user_id != request.user_id:
            return jsonify({'error': 'AI 텍스트를 재생성할 권한이 없습니다'}), 403
        
        # AI 서비스를 사용하여 텍스트 재생성
        ai_service = get_ai_service()
        new_ai_text = ai_service.transform_text(post.original_text)
        
        # 변환 검증
        if not ai_service.validate_transformation(post.original_text, new_ai_text):
            # 변환이 실패한 경우 기존 텍스트 유지
            return jsonify({'error': 'AI 텍스트 재생성에 실패했습니다'}), 500
        
        # 새로운 AI 텍스트로 업데이트
        post.ai_text = new_ai_text
        db.session.commit()
        
        # 작성자 정보
        author = User.query.get(post.user_id)
        
        # 좋아요 여부 확인
        is_liked = Like.query.filter_by(
            user_id=request.user_id,
            post_id=post_id
        ).first() is not None
        
        return jsonify({
            'message': 'AI 텍스트가 재생성되었습니다',
            'post': {
                'id': post.id,
                'original_text': post.original_text,
                'ai_text': post.ai_text,
                'likes': post.likes,
                'created_at': post.created_at.isoformat(),
                'is_liked': is_liked,
                'author': {
                    'id': author.id,
                    'nickname': author.nickname,
                    'avatar': author.avatar
                } if author else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'AI 텍스트 재생성 중 오류가 발생했습니다'}), 500


@posts_bp.route('/user/<int:user_id>', methods=['GET'])
@auth_required
def get_user_posts(user_id):
    """
    특정 사용자의 게시물 목록 조회
    
    Args:
        user_id (int): 사용자 ID
    
    Query Parameters:
        page (int): 페이지 번호 (기본값: 1)
        limit (int): 페이지당 항목 수 (기본값: 10, 최대: 50)
    
    Returns:
        200: 사용자의 게시물 목록
        404: 사용자 없음
    """
    try:
        # 사용자 존재 확인
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': '사용자를 찾을 수 없습니다'}), 404
        
        # 페이지네이션 파라미터
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 10, type=int), 50)
        
        # 해당 사용자의 게시물 쿼리
        posts_query = Post.query.filter_by(user_id=user_id).order_by(desc(Post.created_at))
        
        # 페이지네이션 적용
        paginated = posts_query.paginate(
            page=page,
            per_page=limit,
            error_out=False
        )
        
        # 현재 사용자가 좋아요한 게시물 ID 목록
        liked_post_ids = db.session.query(Like.post_id).filter_by(
            user_id=request.user_id
        ).all()
        liked_post_ids = [id[0] for id in liked_post_ids]
        
        # 게시물 데이터 가공
        posts_data = []
        for post in paginated.items:
            posts_data.append({
                'id': post.id,
                'original_text': post.original_text,
                'ai_text': post.ai_text,
                'likes': post.likes,
                'created_at': post.created_at.isoformat(),
                'is_liked': post.id in liked_post_ids,
                'author': {
                    'id': user.id,
                    'nickname': user.nickname,
                    'avatar': user.avatar
                }
            })
        
        return jsonify({
            'posts': posts_data,
            'user': {
                'id': user.id,
                'nickname': user.nickname,
                'avatar': user.avatar
            },
            'pagination': {
                'page': paginated.page,
                'pages': paginated.pages,
                'per_page': paginated.per_page,
                'total': paginated.total,
                'has_prev': paginated.has_prev,
                'has_next': paginated.has_next
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': '사용자 게시물 조회 중 오류가 발생했습니다'}), 500