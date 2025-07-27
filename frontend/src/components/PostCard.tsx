import { useState, useEffect } from 'react'
import { Post, Comment } from '../services/api'
import { apiService } from '../services/api'
import CommentSection from './CommentSection'

interface PostCardProps {
  post: Post
  onLikeToggle: (postId: number) => void
  onDelete: (postId: number) => void
}

/**
 * 게시물 카드 컴포넌트
 * 
 * 개별 게시물을 표시하고 좋아요, 댓글 기능을 제공합니다.
 */
const PostCard: React.FC<PostCardProps> = ({ post, onLikeToggle, onDelete }) => {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLiking, setIsLiking] = useState(false)
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)

  useEffect(() => {
    // 봇 댓글이 있으면 comments 상태 업데이트
    if (post.bot_comments) {
      setComments(post.bot_comments)
    }
  }, [post.bot_comments])

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    setShowLikeAnimation(true)
    
    try {
      await onLikeToggle(post.id)
      
      // 애니메이션 후 제거
      setTimeout(() => {
        setShowLikeAnimation(false)
      }, 600)
    } finally {
      setIsLiking(false)
    }
  }

  const fetchFullPost = async () => {
    try {
      const fullPost = await apiService.getPost(post.id)
      if (fullPost.comments) {
        setComments(fullPost.comments)
      }
    } catch (error) {
      console.error('Failed to fetch full post:', error)
    }
  }

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchFullPost()
    }
    setShowComments(!showComments)
  }

  const handleCommentAdded = (newComment: Comment) => {
    setComments([...comments, newComment])
    
    // 봇 답글은 자동으로 추가됨 (서버에서 처리)
    setTimeout(() => {
      fetchFullPost()
    }, 5000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  const formatLikes = (likes: number) => {
    if (likes >= 1000000) {
      return `${(likes / 1000000).toFixed(1)}M`
    }
    if (likes >= 1000) {
      return `${(likes / 1000).toFixed(1)}K`
    }
    return likes.toString()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* 게시물 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full bg-cover bg-center"
              style={{
                backgroundImage: `url('/avatars.jpg')`,
                backgroundPosition: `${(post.user.avatar - 1) * 25}% 0`
              }}
            />
            <div>
              <h3 className="font-semibold text-gray-800">{post.user.nickname}</h3>
              <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
            </div>
          </div>
          {post.is_owner && (
            <button
              onClick={() => onDelete(post.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="삭제"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 게시물 내용 */}
      <div className="px-6 py-4">
        <div className="mb-3">
          <p className="text-sm text-gray-500 mb-1">원래 내용:</p>
          <p className="text-gray-700">{post.original_text}</p>
        </div>
        <div className="relative">
          <p className="text-sm text-gray-500 mb-1">AI가 과장한 내용:</p>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <p className="text-gray-800 font-medium">{post.ai_text}</p>
            <div className="absolute -top-2 -right-2">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full">
                AI ✨
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 transition-colors relative ${
                post.is_liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <svg 
                className="w-6 h-6" 
                fill={post.is_liked ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-medium">{formatLikes(post.likes)}</span>
              
              {/* 좋아요 애니메이션 */}
              {showLikeAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="like-explosion">
                    {['❤️', '💕', '💖', '💗', '💝'].map((emoji, index) => (
                      <span 
                        key={index} 
                        className="like-particle"
                        style={{
                          '--angle': `${index * 72}deg`,
                          animationDelay: `${index * 0.1}s`
                        } as React.CSSProperties}
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={handleToggleComments}
              className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium">
                {comments.length + (post.user_comment_count || 0)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 댓글 섹션 */}
      {showComments && (
        <CommentSection
          postId={post.id}
          comments={comments}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  )
}

export default PostCard