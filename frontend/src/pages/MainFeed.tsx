/**
 * 메인 피드 페이지
 * 
 * 모든 게시물을 표시하는 메인 피드
 */

import React, { useState, useEffect } from 'react';
import { getPosts, Post } from '../services/api';
import CreatePost from '../components/posts/CreatePost';
import PostCard from '../components/posts/PostCard';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, RefreshCw } from 'lucide-react';

export default function MainFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  /**
   * 게시물 목록 불러오기
   */
  const loadPosts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const response = await getPosts(pageNum, 10);
      
      if (append) {
        // 페이지네이션: 기존 게시물에 추가
        setPosts(prev => [...prev, ...response.posts]);
      } else {
        // 새로고침: 게시물 목록 교체
        setPosts(response.posts);
      }
      
      setHasMore(response.pagination.has_next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시물을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  /**
   * 컴포넌트 마운트 시 게시물 로드
   */
  useEffect(() => {
    loadPosts();
  }, []);
  
  /**
   * 새 게시물이 생성되었을 때
   */
  const handlePostCreated = (newPost: Post) => {
    // 목록 맨 위에 새 게시물 추가
    setPosts(prev => [newPost, ...prev]);
  };
  
  /**
   * 더 보기 버튼 클릭
   */
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, true);
  };
  
  /**
   * 새로고침 버튼 클릭
   */
  const handleRefresh = () => {
    setPage(1);
    loadPosts(1, false);
  };
  
  /**
   * 게시물 삭제 핸들러
   */
  const handleDeletePost = (postId: number) => {
    // 실제 삭제는 다음 단계에서 구현
    setPosts(prev => prev.filter(post => post.id !== postId));
  };
  
  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* 페이지 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">피드</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>
      
      {/* 게시물 작성 폼 */}
      <CreatePost onPostCreated={handlePostCreated} />
      
      {/* 로딩 상태 */}
      {loading && posts.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* 에러 상태 */}
      {error && !loading && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* 게시물 목록 */}
      {posts.length > 0 ? (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={() => handleDeletePost(post.id)}
            />
          ))}
          
          {/* 더 보기 버튼 */}
          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="min-w-[200px]"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    불러오는 중...
                  </>
                ) : (
                  '더 보기'
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">아직 게시물이 없습니다.</p>
            <p className="text-gray-400 text-sm">첫 번째 과장을 시작해보세요!</p>
          </div>
        )
      )}
    </div>
  );
}