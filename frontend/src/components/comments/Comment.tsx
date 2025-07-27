/**
 * 개별 댓글 컴포넌트
 * 
 * 사용자/봇 댓글을 표시하고 답글, 수정, 삭제 기능을 제공
 */

import React, { useState } from 'react';
import { Comment as CommentType } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatRelativeTime } from '../../utils/format';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { MessageCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import CommentForm from './CommentForm';

interface CommentProps {
  comment: CommentType;
  onReply: (commentId: number, content: string) => Promise<void>;
  onEdit: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  isReplying?: boolean;
  onCancelReply?: () => void;
  level?: number; // 중첩 레벨 (0: 최상위, 1: 대댓글...)
}

export default function Comment({
  comment,
  onReply,
  onEdit,
  onDelete,
  isReplying = false,
  onCancelReply,
  level = 0,
}: CommentProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  // 작성자 권한 확인 (봇 댓글은 수정/삭제 불가)
  const canModify = !comment.is_bot && user?.id === comment.author?.id;
  
  // 최대 중첩 레벨 제한 (3단계까지만)
  const canReply = level < 2;

  /**
   * 답글 작성 핸들러
   */
  const handleReply = async (content: string) => {
    await onReply(comment.id, content);
    onCancelReply?.();
  };

  /**
   * 댓글 수정 핸들러
   */
  const handleEdit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  /**
   * 댓글 삭제 핸들러
   */
  const handleDelete = async () => {
    if (window.confirm('이 댓글을 삭제하시겠습니까?')) {
      await onDelete(comment.id);
    }
  };

  // 봇 댓글 특별 스타일링
  const isBot = comment.is_bot;
  const botEmojis = {
    '하이프봇3000': '🤖',
    '질투AI': '😤', 
    '캡틴과장러': '📊',
    '아첨꾼2.0': '✨',
    '축하봇': '🎉',
    '의심킹': '🤔'
  };

  return (
    <div className={`space-y-3 ${level > 0 ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}>
      {/* 메인 댓글 */}
      <div className={`p-4 rounded-lg ${
        isBot 
          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200' 
          : 'bg-gray-50 hover:bg-gray-100'
      } transition-colors`}>
        <div className="flex items-start space-x-3">
          {/* 아바타 */}
          <Avatar className="w-8 h-8">
            {isBot ? (
              <div className="w-full h-full bg-purple-100 flex items-center justify-center text-lg">
                {botEmojis[comment.bot_name] || '🤖'}
              </div>
            ) : (
              <>
                <AvatarImage
                  src="/avatars.jpg"
                  alt={comment.author?.nickname || 'Unknown'}
                  className="object-cover"
                  style={{
                    objectPosition: `${((comment.author?.avatar || 1) - 1) * 25}% 0`,
                  }}
                />
                <AvatarFallback>
                  {comment.author?.nickname?.[0] || '?'}
                </AvatarFallback>
              </>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* 작성자 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`font-semibold text-sm ${
                  isBot ? 'text-purple-700' : 'text-gray-900'
                }`}>
                  {isBot ? comment.bot_name : comment.author?.nickname}
                </span>
                {isBot && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                    봇
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(comment.created_at)}
                </span>
              </div>

              {/* 더보기 메뉴 (수정/삭제) */}
              {canModify && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-3 w-3 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* 댓글 내용 또는 수정 폼 */}
            {isEditing ? (
              <div className="mt-2">
                <CommentForm
                  onSubmit={handleEdit}
                  onCancel={() => setIsEditing(false)}
                  initialValue={comment.content}
                  placeholder="댓글을 수정하세요..."
                  submitLabel="수정 완료"
                  isReply={true}
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            {/* 액션 버튼들 */}
            {!isEditing && (
              <div className="mt-2 flex items-center space-x-2">
                {canReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isReplying ? onCancelReply : () => {}}
                    className="text-xs h-6 px-2"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    답글
                  </Button>
                )}

                {/* 대댓글 개수 표시 및 토글 */}
                {comment.replies && comment.replies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplies(!showReplies)}
                    className="text-xs h-6 px-2 text-gray-500"
                  >
                    {showReplies ? '답글 숨기기' : `답글 ${comment.replies.length}개 보기`}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 답글 작성 폼 */}
      {isReplying && canReply && (
        <CommentForm
          onSubmit={handleReply}
          onCancel={onCancelReply}
          placeholder="답글을 작성하세요..."
          submitLabel="답글 작성"
          isReply={true}
        />
      )}

      {/* 대댓글 목록 */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}