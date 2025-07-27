/**
 * 게시물 작성 컴포넌트
 * 
 * 새로운 게시물을 작성하는 폼 UI
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createPost } from '../../services/api';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Sparkles, Loader2 } from 'lucide-react';

interface CreatePostProps {
  onPostCreated?: (post: any) => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('게시물 내용을 입력해주세요.');
      return;
    }
    
    if (text.length > 500) {
      setError('게시물은 500자 이내로 작성해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await createPost(text);
      setText(''); // 입력 필드 초기화
      onPostCreated?.(response.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시물 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src="/avatars.jpg"
                alt={user.nickname}
                className="object-cover"
                style={{
                  objectPosition: `${(user.avatar - 1) * 25}% 0`,
                }}
              />
              <AvatarFallback>{user.nickname[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm">{user.nickname}</p>
              <p className="text-xs text-gray-500">무엇을 과장해볼까요?</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* 텍스트 입력 영역 */}
          <Textarea
            placeholder="평범한 일상을 입력하면 AI가 화려하게 과장해드립니다!"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          
          {/* 글자 수 표시 */}
          <div className="mt-2 text-right">
            <span className={`text-xs ${text.length > 450 ? 'text-red-600' : 'text-gray-500'}`}>
              {text.length} / 500
            </span>
          </div>
          
          {/* AI 안내 메시지 */}
          <div className="mt-3 p-3 bg-purple-50 rounded-lg flex items-start space-x-2">
            <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
            <p className="text-xs text-purple-700">
              AI가 당신의 평범한 일상을 놀라운 성과로 변환해드립니다!
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="pt-3 border-t">
          <div className="flex justify-end w-full">
            <Button
              type="submit"
              disabled={loading || !text.trim()}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  과장 중...
                </>
              ) : (
                '과장하기'
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}