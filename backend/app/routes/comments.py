"""
댓글 관련 API 엔드포인트
교육용 프로젝트 - 11단계: Comments Backend
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db
from app.models.comment import Comment
from app.models.post import Post
from app.models.user import User
from app.services.ai_service import ai_service
from app.services.bot_service import bot_service
from app.utils.decorators import auth_required
import threading
import random

bp = Blueprint('comments', __name__, url_prefix='/api/comments')

@bp.route('/', methods=['POST'])
@auth_required
def create_comment():
    """댓글 생성
    
    사용자 댓글 생성 후 봇 대댓글 자동 스케줄링
    """
    try:
        data = request.get_json()
        post_id = data.get('post_id')
        content = data.get('content')
        parent_id = data.get('parent_id')  # 대댓글인 경우
        
        # 필수 필드 검증
        if not post_id or not content:
            return jsonify({'error': '게시물 ID와 내용은 필수입니다'}), 400
        
        # 게시물 존재 확인
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': '게시물을 찾을 수 없습니다'}), 404
        
        # 부모 댓글 확인 (대댓글인 경우)
        if parent_id:
            parent_comment = Comment.query.get(parent_id)
            if not parent_comment or parent_comment.post_id != post_id:
                return jsonify({'error': '유효하지 않은 부모 댓글입니다'}), 400
        
        # 사용자 정보 가져오기
        user_id = get_jwt_identity()
        
        # AI로 댓글 변환 (선택적)
        ai_content = ai_service.transform_text(content)
        
        # 댓글 생성
        comment = Comment(
            post_id=post_id,
            user_id=user_id,
            parent_id=parent_id,
            original_text=content,
            content=ai_content if ai_content else content,
            is_bot=False
        )
        
        db.session.add(comment)
        db.session.commit()
        
        # 봇 대댓글 스케줄링 (사용자 댓글에 대해서만)
        if not parent_id:  # 최상위 댓글인 경우만
            _schedule_bot_replies(comment.id, post.ai_text or post.original_text)
        
        return jsonify({
            'message': '댓글이 생성되었습니다',
            'comment': comment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'댓글 생성 중 오류가 발생했습니다: {str(e)}'}), 500

@bp.route('/post/<int:post_id>', methods=['GET'])
def get_post_comments(post_id):
    """특정 게시물의 모든 댓글 조회 (스레드 구조)"""
    try:
        # 게시물 존재 확인
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'error': '게시물을 찾을 수 없습니다'}), 404
        
        # 최상위 댓글만 조회 (parent_id가 None인 것)
        top_level_comments = Comment.query.filter_by(
            post_id=post_id,
            parent_id=None
        ).order_by(Comment.created_at.desc()).all()
        
        # 스레드 구조로 변환
        comments_data = [comment.to_dict(include_replies=True) for comment in top_level_comments]
        
        return jsonify({
            'comments': comments_data,
            'total': len(comments_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'댓글 조회 중 오류가 발생했습니다: {str(e)}'}), 500

@bp.route('/<int:comment_id>', methods=['DELETE'])
@auth_required
def delete_comment(comment_id):
    """댓글 삭제 (작성자만 가능)"""
    try:
        user_id = get_jwt_identity()
        comment = Comment.query.get(comment_id)
        
        if not comment:
            return jsonify({'error': '댓글을 찾을 수 없습니다'}), 404
        
        # 작성자 확인
        if comment.user_id != user_id:
            return jsonify({'error': '본인의 댓글만 삭제할 수 있습니다'}), 403
        
        # 대댓글이 있는 경우 내용만 변경
        if comment.replies:
            comment.content = "[삭제된 댓글입니다]"
            comment.original_text = None
        else:
            # 대댓글이 없으면 완전 삭제
            db.session.delete(comment)
        
        db.session.commit()
        
        return jsonify({'message': '댓글이 삭제되었습니다'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'댓글 삭제 중 오류가 발생했습니다: {str(e)}'}), 500

def _schedule_bot_replies(comment_id, context_text):
    """사용자 댓글에 대한 봇 대댓글 스케줄링
    
    Args:
        comment_id: 부모 댓글 ID
        context_text: 컨텍스트 추출용 텍스트
    """
    # 봇 2개 선택
    selected_bots = random.sample(bot_service.bot_personas, min(2, len(bot_service.bot_personas)))
    
    for index, bot in enumerate(selected_bots):
        # 대댓글은 더 빠르게 생성 (2-6초)
        delay = random.randint(2, 6) + (index * 1.5)
        
        timer = threading.Timer(
            delay,
            _create_bot_reply,
            args=[comment_id, bot, context_text]
        )
        timer.start()

def _create_bot_reply(parent_comment_id, bot_persona, context_text):
    """봇 대댓글 생성
    
    Args:
        parent_comment_id: 부모 댓글 ID
        bot_persona: 봇 페르소나 정보
        context_text: 컨텍스트 추출용 텍스트
    """
    try:
        # Flask 앱 컨텍스트 설정
        from app import create_app
        app = create_app()
        
        with app.app_context():
            # 부모 댓글 확인
            parent_comment = Comment.query.get(parent_comment_id)
            if not parent_comment:
                return
            
            # 봇 댓글 생성
            bot_comment_text = bot_service.generate_bot_comment(bot_persona, context_text)
            
            bot_reply = Comment(
                post_id=parent_comment.post_id,
                user_id=None,  # 봇은 user_id가 없음
                parent_id=parent_comment_id,
                original_text=None,
                content=bot_comment_text,
                is_bot=True,
                bot_name=bot_persona['name']
            )
            
            db.session.add(bot_reply)
            db.session.commit()
            
            print(f"봇 대댓글 생성 완료: {bot_persona['name']} -> 댓글 ID {parent_comment_id}")
            
    except Exception as e:
        print(f"봇 대댓글 생성 중 오류: {e}")

# 게시물 생성 시 봇 댓글 자동 생성을 위한 헬퍼 함수
def create_bot_comments_for_post(post_id, post_text, ai_text):
    """게시물에 대한 봇 댓글 생성
    
    Args:
        post_id: 게시물 ID
        post_text: 원본 텍스트
        ai_text: AI 변환 텍스트
    """
    try:
        # Flask 앱 컨텍스트 설정
        from app import create_app
        app = create_app()
        
        with app.app_context():
            # 봇 3개 선택
            selected_bots = random.sample(bot_service.bot_personas, min(3, len(bot_service.bot_personas)))
            context_text = ai_text if ai_text else post_text
            
            for bot in selected_bots:
                # 봇 댓글 생성
                bot_comment_text = bot_service.generate_bot_comment(bot, context_text)
                
                bot_comment = Comment(
                    post_id=post_id,
                    user_id=None,
                    parent_id=None,
                    original_text=None,
                    content=bot_comment_text,
                    is_bot=True,
                    bot_name=bot['name']
                )
                
                db.session.add(bot_comment)
            
            db.session.commit()
            print(f"게시물 {post_id}에 봇 댓글 {len(selected_bots)}개 생성 완료")
            
    except Exception as e:
        print(f"봇 댓글 생성 중 오류: {e}")