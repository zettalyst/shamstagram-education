"""
게시물 관련 라우트

게시물 CRUD 및 댓글, 좋아요 기능을 제공합니다.
"""

import random
import threading
from datetime import datetime, timezone
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import User, Post, Comment, Like
from app.services.auth_service import AuthService
from app.services.ai_service import AIService

# 블루프린트 생성
posts_bp = Blueprint('posts', __name__)

# AI 서비스 인스턴스
ai_service = AIService()


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


def schedule_bot_comments(post_id: int):
    """봇 댓글을 예약합니다."""
    def create_bot_comment(post_id: int, bot_name: str, delay: int):
        """지연 후 봇 댓글을 생성합니다."""
        with current_app.app_context():
            post = Post.query.get(post_id)
            if not post:
                return
            
            # 봇 댓글 생성
            bot_comment_data = ai_service.generate_bot_comment(post.ai_text, bot_name)
            
            comment = Comment(
                post_id=post_id,
                content=bot_comment_data['content'],
                is_bot=True,
                bot_name=bot_name,
                delay=delay
            )
            
            db.session.add(comment)
            db.session.commit()
    
    # 3개의 랜덤 봇 선택
    bot_names = random.sample(ai_service.get_bot_names(), 3)
    
    for i, bot_name in enumerate(bot_names):
        delay = random.randint(3, 10) + i * 2  # 3-10초 + 인덱스별 추가 지연
        timer = threading.Timer(delay, create_bot_comment, args=[post_id, bot_name, delay * 1000])
        timer.start()


@posts_bp.route('', methods=['GET'])
@auth_required
def get_posts():
    """모든 게시물을 가져옵니다."""
    # 최신순으로 정렬
    posts = Post.query.order_by(Post.created_at.desc()).all()
    
    result = []
    for post in posts:
        post_dict = post.to_dict()
        
        # 좋아요 여부 확인
        is_liked = Like.query.filter_by(
            user_id=request.current_user.id,
            post_id=post.id
        ).first() is not None
        
        post_dict['is_liked'] = is_liked
        post_dict['is_owner'] = post.user_id == request.current_user.id
        
        # 봇 댓글만 포함
        bot_comments = []
        for comment in post.comments.filter_by(is_bot=True).all():
            bot_comments.append(comment.to_dict())
        
        post_dict['bot_comments'] = bot_comments
        post_dict['user_comment_count'] = post.comments.filter_by(is_bot=False).count()
        
        result.append(post_dict)
    
    return jsonify(result), 200


@posts_bp.route('/<int:post_id>', methods=['GET'])
@auth_required
def get_post(post_id):
    """특정 게시물을 가져옵니다."""
    post = Post.query.get_or_404(post_id)
    
    post_dict = post.to_dict()
    
    # 좋아요 여부 확인
    is_liked = Like.query.filter_by(
        user_id=request.current_user.id,
        post_id=post.id
    ).first() is not None
    
    post_dict['is_liked'] = is_liked
    post_dict['is_owner'] = post.user_id == request.current_user.id
    
    # 모든 댓글 포함 (봇 + 사용자)
    comments = []
    for comment in post.comments.order_by(Comment.created_at).all():
        comment_dict = comment.to_dict(include_replies=True)
        comments.append(comment_dict)
    
    post_dict['comments'] = comments
    
    return jsonify(post_dict), 200


@posts_bp.route('', methods=['POST'])
@auth_required
def create_post():
    """새 게시물을 생성합니다."""
    data = request.get_json()
    original_text = data.get('original_text', '').strip()
    
    if not original_text:
        return jsonify({'error': '내용을 입력해주세요.'}), 400
    
    if len(original_text) > 500:
        return jsonify({'error': '내용은 500자 이내로 입력해주세요.'}), 400
    
    # AI로 텍스트 변환
    ai_text = ai_service.transform_text(original_text)
    
    # 게시물 생성
    post = Post(
        user_id=request.current_user.id,
        original_text=original_text,
        ai_text=ai_text
    )
    
    db.session.add(post)
    db.session.commit()
    
    # 초기 좋아요 수 설정 (데모용)
    initial_likes = random.randint(50000, 2000000)
    for _ in range(min(initial_likes, 100)):  # 실제로는 100개만 생성
        # 더미 데이터로 처리
        pass
    
    # 봇 댓글 예약
    schedule_bot_comments(post.id)
    
    # 응답
    post_dict = post.to_dict()
    post_dict['is_liked'] = False
    post_dict['is_owner'] = True
    post_dict['bot_comments'] = []
    post_dict['user_comment_count'] = 0
    
    return jsonify(post_dict), 201


@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@auth_required
def delete_post(post_id):
    """게시물을 삭제합니다."""
    post = Post.query.get_or_404(post_id)
    
    # 작성자 확인
    if post.user_id != request.current_user.id:
        return jsonify({'error': '권한이 없습니다.'}), 403
    
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({'message': '게시물이 삭제되었습니다.'}), 200


@posts_bp.route('/<int:post_id>/like', methods=['POST'])
@auth_required
def toggle_like(post_id):
    """게시물 좋아요를 토글합니다."""
    post = Post.query.get_or_404(post_id)
    
    # 기존 좋아요 확인
    existing_like = Like.query.filter_by(
        user_id=request.current_user.id,
        post_id=post_id
    ).first()
    
    if existing_like:
        # 좋아요 취소
        db.session.delete(existing_like)
        is_liked = False
    else:
        # 좋아요 추가
        new_like = Like(
            user_id=request.current_user.id,
            post_id=post_id
        )
        db.session.add(new_like)
        is_liked = True
    
    db.session.commit()
    
    return jsonify({
        'is_liked': is_liked,
        'like_count': post.likes.count()
    }), 200


@posts_bp.route('/<int:post_id>/comments', methods=['POST'])
@auth_required
def create_comment(post_id):
    """댓글을 생성합니다."""
    post = Post.query.get_or_404(post_id)
    
    data = request.get_json()
    original_text = data.get('original_text', '').strip()
    parent_id = data.get('parent_id')
    
    if not original_text:
        return jsonify({'error': '댓글 내용을 입력해주세요.'}), 400
    
    if len(original_text) > 200:
        return jsonify({'error': '댓글은 200자 이내로 입력해주세요.'}), 400
    
    # AI로 댓글 변환
    content = ai_service.transform_text(original_text)
    
    # 댓글 생성
    comment = Comment(
        post_id=post_id,
        user_id=request.current_user.id,
        parent_id=parent_id,
        original_text=original_text,
        content=content,
        is_bot=False
    )
    
    db.session.add(comment)
    db.session.commit()
    
    # 봇 답글 예약 (대댓글이 아닌 경우만)
    if not parent_id:
        def create_bot_reply(comment_id: int, bot_name: str):
            """봇 답글을 생성합니다."""
            with current_app.app_context():
                parent_comment = Comment.query.get(comment_id)
                if not parent_comment:
                    return
                
                bot_comment_data = ai_service.generate_bot_comment(parent_comment.content, bot_name)
                
                reply = Comment(
                    post_id=post_id,
                    parent_id=comment_id,
                    content=bot_comment_data['content'],
                    is_bot=True,
                    bot_name=bot_name,
                    delay=3000
                )
                
                db.session.add(reply)
                db.session.commit()
        
        # 2개의 봇 답글
        bot_names = random.sample(ai_service.get_bot_names(), 2)
        for i, bot_name in enumerate(bot_names):
            delay = random.randint(2, 6) + i * 1.5
            timer = threading.Timer(delay, create_bot_reply, args=[comment.id, bot_name])
            timer.start()
    
    return jsonify(comment.to_dict(include_replies=True)), 201