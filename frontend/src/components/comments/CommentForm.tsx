/**
 * 댓글 작성 폼 컴포넌트
 * 
 * 새 댓글 작성 및 기존 댓글 수정을 위한 폼
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  isLoading?: boolean;
  isReply?: boolean;
}

export default function CommentForm({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder = '댓글을 작성하세요...',
  submitLabel = '댓글 작성',
  isLoading = false,
  isReply = false,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content.trim());
      setContent(''); // 성공시 폼 초기화
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 취소 핸들러
   */
  const handleCancel = () => {
    setContent(initialValue);
    onCancel?.();
  };

  const isFormValid = content.trim().length > 0;
  const isProcessing = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${isReply ? 'ml-12' : ''}`}>
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={isReply ? 2 : 3}
          disabled={isProcessing}
          className="resize-none"
          maxLength={500}
        />
        
        {/* 글자 수 표시 */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{content.length}/500</span>
          {content.length > 450 && (
            <span className="text-orange-500">
              {500 - content.length}자 남음
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          type="submit"
          size="sm"
          disabled={!isFormValid || isProcessing}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>처리중...</span>
            </div>
          ) : (
            submitLabel
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            취소
          </Button>
        )}
      </div>
    </form>
  );
}