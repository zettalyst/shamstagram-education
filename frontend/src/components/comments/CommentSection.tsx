/**
 * 댓글 섹션 컴포넌트
 * 
 * 게시물의 댓글 목록과 댓글 작성 폼을 관리하는 최상위 컨테이너
 */

import React, { useState, useEffect } from 'react';
import { Comment, getComments, createComment, updateComment, deleteComment } from '../../services/api';
import CommentForm from './CommentForm';
import CommentComponent from './Comment';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';

interface CommentSectionProps {
  postId: number;
  isVisible: boolean;
  onToggle: () => void;
  initialCommentCount?: number;
}

export default function CommentSection({
  postId,
  isVisible,
  onToggle,
  initialCommentCount = 0,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  /**
   * 댓글 목록 로딩
   */
  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getComments(postId);
      setComments(response.comments);
      setCommentCount(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 섹션이 열릴 때 댓글 로딩
   */
  useEffect(() => {
    if (isVisible && comments.length === 0) {
      loadComments();
    }
  }, [isVisible, postId]);

  /**
   * 새 댓글 작성
   */
  const handleCreateComment = async (content: string) => {
    try {
      const response = await createComment(postId, content);
      
      // 댓글을 목록에 추가
      setComments(prev => [response.comment, ...prev]);
      setCommentCount(prev => prev + 1);
      
      // 봇 댓글들이 자동으로 추가될 예정이므로 1-2초 후 댓글 목록 새로고침
      setTimeout(() => {
        loadComments();
      }, 1500);
    } catch (err) {
      throw err; // CommentForm에서 에러 처리
    }
  };

  /**
   * 답글 작성
   */
  const handleReply = async (parentId: number, content: string) => {
    try {
      const response = await createComment(postId, content, parentId);
      
      // 부모 댓글의 replies 배열에 추가
      setComments(prev => 
        prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), response.comment]
            };
          }
          return comment;
        })
      );
      
      setReplyingTo(null);
      setCommentCount(prev => prev + 1);
      
      // 봇 대댓글들이 자동으로 추가될 예정이므로 1초 후 댓글 목록 새로고침
      setTimeout(() => {
        loadComments();
      }, 1000);
    } catch (err) {
      throw err;
    }
  };

  /**
   * 댓글 수정
   */
  const handleEditComment = async (commentId: number, content: string) => {
    try {
      const response = await updateComment(commentId, content);
      
      // 댓글 목록에서 해당 댓글 업데이트
      const updateCommentInList = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, content: response.comment.content };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateCommentInList(comment.replies)
            };
          }
          return comment;
        });
      };
      
      setComments(prev => updateCommentInList(prev));
    } catch (err) {
      throw err;
    }
  };

  /**
   * 댓글 삭제
   */
  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      
      // 댓글 목록에서 해당 댓글 제거
      const removeCommentFromList = (comments: Comment[]): Comment[] => {
        return comments.filter(comment => {
          if (comment.id === commentId) {
            return false;
          }
          if (comment.replies) {
            comment.replies = removeCommentFromList(comment.replies);
          }
          return true;
        });
      };
      
      setComments(prev => removeCommentFromList(prev));
      setCommentCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="border-t border-gray-200">
      {/* 댓글 섹션 헤더 */}
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={onToggle}
          className="w-full justify-between hover:bg-gray-50"
        >
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">
              댓글 {commentCount > 0 && `${commentCount}개`}
            </span>
          </div>
          {isVisible ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 댓글 내용 */}
      {isVisible && (
        <div className="px-4 pb-4 space-y-4">
          {/* 새 댓글 작성 폼 */}
          <CommentForm
            onSubmit={handleCreateComment}
            placeholder="댓글을 작성하세요..."
            submitLabel="댓글 작성"
          />

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                <span className="text-sm">댓글을 불러오는 중...</span>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 font-medium">오류</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadComments}
                className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                다시 시도
              </Button>
            </div>
          )}

          {/* 댓글 목록 */}
          {!loading && !error && (
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">아직 댓글이 없습니다.</p>
                  <p className="text-gray-400 text-sm">첫 번째 댓글을 작성해보세요!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentComponent
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    isReplying={replyingTo === comment.id}
                    onCancelReply={() => setReplyingTo(null)}
                  />
                ))
              )}
            </div>
          )}

          {/* 봇 댓글 안내 메시지 */}
          {comments.length > 0 && !loading && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">
                🤖 AI 봇들이 곧 댓글을 달 예정입니다...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}