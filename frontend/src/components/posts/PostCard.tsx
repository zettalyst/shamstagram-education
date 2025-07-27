/**
 * 게시물 카드 컴포넌트
 * 
 * 개별 게시물을 표시하는 카드 UI
 */

import React, { useState } from 'react';
import { Post } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatNumber, formatRelativeTime } from '../../utils/format';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Heart, MessageCircle, Share2, MoreVertical, Sparkles, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRegenerateAI?: () => void;
}

export default function PostCard({
  post,
  onLike,
  onComment,
  onEdit,
  onDelete,
  onRegenerateAI,
}: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // 작성자 여부 확인
  const isAuthor = user?.id === post.author.id;
  
  /**
   * 좋아요 버튼 클릭 핸들러
   */
  const handleLike = () => {
    // 좋아요 토글 (실제 API 호출은 13단계에서 구현)
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike?.();
  };
  
  /**
   * AI 텍스트 재생성 핸들러
   */
  const handleRegenerateAI = async () => {
    if (!isAuthor || !onRegenerateAI) return;
    
    setIsRegenerating(true);
    try {
      await onRegenerateAI();
    } finally {
      setIsRegenerating(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto mb-4 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* 작성자 정보 */}
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src="/avatars.jpg"
                alt={post.author.nickname}
                className="object-cover"
                style={{
                  objectPosition: `${(post.author.avatar - 1) * 25}% 0`,
                }}
              />
              <AvatarFallback>{post.author.nickname[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.author.nickname}</p>
              <p className="text-xs text-gray-500">{formatRelativeTime(post.created_at)}</p>
            </div>
          </div>
          
          {/* 더보기 메뉴 (작성자만) */}
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  수정하기
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  삭제하기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        {/* 원본 텍스트 */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">원본:</p>
          <p className="text-sm">{post.original_text}</p>
        </div>
        
        {/* AI 변환 텍스트 */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-semibold text-purple-700">AI 과장 버전</p>
            </div>
            
            {/* 재생성 버튼 (작성자만) */}
            {isAuthor && onRegenerateAI && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerateAI}
                disabled={isRegenerating}
                className="h-8 px-2 text-purple-600 hover:text-purple-700"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span className="ml-1 text-xs">재생성</span>
              </Button>
            )}
          </div>
          
          {/* AI 텍스트 또는 로딩 상태 */}
          {isRegenerating ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-5 w-5 text-purple-600 animate-spin" />
              <span className="ml-2 text-sm text-purple-600">AI가 새로운 과장을 만들고 있습니다...</span>
            </div>
          ) : (
            <p className="text-base font-medium leading-relaxed">{post.ai_text}</p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 pb-3 border-t">
        <div className="flex items-center justify-between w-full">
          {/* 액션 버튼들 */}
          <div className="flex items-center space-x-1">
            {/* 좋아요 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`space-x-1 ${isLiked ? 'text-red-600' : ''}`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{formatNumber(likeCount)}</span>
            </Button>
            
            {/* 댓글 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onComment}
              className="space-x-1"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">댓글</span>
            </Button>
            
            {/* 공유 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className="space-x-1"
            >
              <Share2 className="h-5 w-5" />
              <span className="text-sm">공유</span>
            </Button>
          </div>
          
          {/* 좋아요 수 표시 */}
          <div className="text-sm text-gray-500">
            좋아요 {formatNumber(likeCount)}개
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}