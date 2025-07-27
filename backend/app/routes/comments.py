"""
댓글 관련 API 라우트
"""
from flask import Blueprint, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app.models.comment import Comment
from app.models.post import Post
from app.services.auth_service import auth_required
from app.services.bot_service import bot_service
from app import db
import logging

# 블루프린트 생성
comments_bp = Blueprint('comments', __name__)

# Rate limiter 설정
limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)


@comments_bp.route('/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    """특정 게시물의 댓글 목록 조회"""
    try:
        # 포스트 존재 확인
        post = Post.query.get_or_404(post_id)
        
        # 댓글 조회 (최신순, 대댓글 포함)
        comments = Comment.query.filter_by(post_id=post_id)\
                               .order_by(Comment.created_at.desc())\
                               .all()
        
        # 댓글을 트리 구조로 변환
        comment_tree = []
        comment_dict = {}
        
        # 모든 댓글을 딕셔너리로 변환
        for comment in comments:
            comment_data = {
                'id': comment.id,
                'content': comment.content,
                'original_text': comment.original_text,
                'user_id': comment.user_id,
                'user_nickname': comment.user.nickname if comment.user else None,
                'user_avatar': comment.user.avatar if comment.user else None,
                'bot_name': comment.bot_name,
                'is_bot': comment.is_bot,
                'parent_id': comment.parent_id,
                'created_at': comment.created_at.isoformat(),
                'replies': []
            }
            comment_dict[comment.id] = comment_data
        
        # 트리 구조 구성
        for comment in comments:
            comment_data = comment_dict[comment.id]
            if comment.parent_id is None:
                # 최상위 댓글
                comment_tree.append(comment_data)
            else:
                # 대댓글
                if comment.parent_id in comment_dict:
                    comment_dict[comment.parent_id]['replies'].append(comment_data)
        
        # 최신순으로 정렬 (대댓글도 최신순)
        comment_tree.sort(key=lambda x: x['created_at'], reverse=True)
        for comment in comment_tree:
            comment['replies'].sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            'comments': comment_tree,
            'total': len(comments)
        })
        
    except Exception as e:
        logger.error(f"댓글 조회 실패: {e}")
        return jsonify({'error': '댓글을 불러올 수 없습니다'}), 500


@comments_bp.route('/posts/<int:post_id>/comments', methods=['POST'])
@auth_required
@limiter.limit("30 per minute")
def create_comment(post_id, current_user):
    """새 댓글 작성"""
    try:
        data = request.get_json()
        
        if not data or not data.get('content'):
            return jsonify({'error': '댓글 내용이 필요합니다'}), 400
        
        content = data['content'].strip()
        if len(content) < 1:
            return jsonify({'error': '댓글 내용이 너무 짧습니다'}), 400
        
        if len(content) > 1000:
            return jsonify({'error': '댓글이 너무 깁니다 (최대 1000자)'}), 400
        
        # 포스트 존재 확인
        post = Post.query.get_or_404(post_id)
        
        # 부모 댓글 확인 (대댓글인 경우)
        parent_id = data.get('parent_id')
        if parent_id:
            parent_comment = Comment.query.get_or_404(parent_id)
            if parent_comment.post_id != post_id:
                return jsonify({'error': '잘못된 부모 댓글입니다'}), 400
        
        # 댓글 생성
        comment = Comment(
            post_id=post_id,
            user_id=current_user.id,
            parent_id=parent_id,
            original_text=content,
            content=content,
            is_bot=False
        )
        
        db.session.add(comment)
        db.session.commit()
        
        # 사용자 댓글에 대한 봇 답글 스케줄링 (최상위 댓글인 경우만)
        if not parent_id:
            try:
                bot_service.schedule_bot_replies(
                    parent_comment_id=comment.id,
                    parent_comment_content=content,
                    post_content=post.ai_text or post.original_text
                )
            except Exception as e:
                logger.warning(f"봇 답글 스케줄링 실패: {e}")
        
        # 응답 데이터 구성
        response_data = {
            'id': comment.id,
            'content': comment.content,
            'original_text': comment.original_text,
            'user_id': comment.user_id,
            'user_nickname': current_user.nickname,
            'user_avatar': current_user.avatar,
            'bot_name': None,
            'is_bot': False,
            'parent_id': comment.parent_id,
            'created_at': comment.created_at.isoformat(),
            'replies': []
        }
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"댓글 작성 실패: {e}")
        return jsonify({'error': '댓글 작성에 실패했습니다'}), 500


@comments_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@auth_required
@limiter.limit("10 per minute")
def delete_comment(comment_id, current_user):
    """댓글 삭제"""
    try:
        comment = Comment.query.get_or_404(comment_id)
        
        # 본인 댓글만 삭제 가능
        if comment.user_id != current_user.id:
            return jsonify({'error': '본인의 댓글만 삭제할 수 있습니다'}), 403
        
        # 봇 댓글은 삭제 불가
        if comment.is_bot:
            return jsonify({'error': '봇 댓글은 삭제할 수 없습니다'}), 403
        
        # 대댓글이 있는 경우 내용만 삭제 표시
        has_replies = Comment.query.filter_by(parent_id=comment_id).first() is not None
        
        if has_replies:
            comment.content = "[삭제된 댓글입니다]"
            comment.original_text = "[삭제된 댓글입니다]"
        else:
            # 대댓글이 없으면 완전 삭제
            db.session.delete(comment)
        
        db.session.commit()
        
        return jsonify({'message': '댓글이 삭제되었습니다'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"댓글 삭제 실패: {e}")
        return jsonify({'error': '댓글 삭제에 실패했습니다'}), 500


@comments_bp.route('/comments/<int:comment_id>', methods=['PUT'])
@auth_required
@limiter.limit("20 per minute")
def update_comment(comment_id, current_user):
    """댓글 수정"""
    try:
        data = request.get_json()
        
        if not data or not data.get('content'):
            return jsonify({'error': '댓글 내용이 필요합니다'}), 400
        
        content = data['content'].strip()
        if len(content) < 1:
            return jsonify({'error': '댓글 내용이 너무 짧습니다'}), 400
        
        if len(content) > 1000:
            return jsonify({'error': '댓글이 너무 깁니다 (최대 1000자)'}), 400
        
        comment = Comment.query.get_or_404(comment_id)
        
        # 본인 댓글만 수정 가능
        if comment.user_id != current_user.id:
            return jsonify({'error': '본인의 댓글만 수정할 수 있습니다'}), 403
        
        # 봇 댓글은 수정 불가
        if comment.is_bot:
            return jsonify({'error': '봇 댓글은 수정할 수 없습니다'}), 403
        
        # 삭제된 댓글은 수정 불가
        if comment.content == "[삭제된 댓글입니다]":
            return jsonify({'error': '삭제된 댓글은 수정할 수 없습니다'}), 403
        
        # 댓글 수정
        comment.content = content
        comment.original_text = content
        
        db.session.commit()
        
        # 응답 데이터 구성
        response_data = {
            'id': comment.id,
            'content': comment.content,
            'original_text': comment.original_text,
            'user_id': comment.user_id,
            'user_nickname': current_user.nickname,
            'user_avatar': current_user.avatar,
            'bot_name': comment.bot_name,
            'is_bot': comment.is_bot,
            'parent_id': comment.parent_id,
            'created_at': comment.created_at.isoformat(),
            'replies': []
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"댓글 수정 실패: {e}")
        return jsonify({'error': '댓글 수정에 실패했습니다'}), 500


@comments_bp.route('/comments/<int:comment_id>/replies', methods=['GET'])
def get_comment_replies(comment_id):
    """특정 댓글의 답글 목록 조회"""
    try:
        # 부모 댓글 존재 확인
        parent_comment = Comment.query.get_or_404(comment_id)
        
        # 답글 조회
        replies = Comment.query.filter_by(parent_id=comment_id)\
                             .order_by(Comment.created_at.asc())\
                             .all()
        
        # 응답 데이터 구성
        reply_list = []
        for reply in replies:
            reply_data = {
                'id': reply.id,
                'content': reply.content,
                'original_text': reply.original_text,
                'user_id': reply.user_id,
                'user_nickname': reply.user.nickname if reply.user else None,
                'user_avatar': reply.user.avatar if reply.user else None,
                'bot_name': reply.bot_name,
                'is_bot': reply.is_bot,
                'parent_id': reply.parent_id,
                'created_at': reply.created_at.isoformat()
            }
            reply_list.append(reply_data)
        
        return jsonify({
            'replies': reply_list,
            'total': len(reply_list)
        })
        
    except Exception as e:
        logger.error(f"답글 조회 실패: {e}")
        return jsonify({'error': '답글을 불러올 수 없습니다'}), 500