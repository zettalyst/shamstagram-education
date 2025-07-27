import { useState } from 'react'
import { Comment } from '../services/api'
import { apiService } from '../services/api'

interface CommentSectionProps {
  postId: number
  comments: Comment[]
  onCommentAdded: (comment: Comment) => void
}

/**
 * 댓글 섹션 컴포넌트
 * 
 * 댓글 목록을 표시하고 새 댓글을 작성할 수 있습니다.
 */
const CommentSection: React.FC<CommentSectionProps> = ({ postId, comments, onCommentAdded }) => {
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!commentText.trim()) return

    setIsSubmitting(true)
    
    try {
      const newComment = await apiService.createComment(postId, {
        original_text: commentText.trim()
      })
      onCommentAdded(newComment)
      setCommentText('')
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert('댓글 작성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault()
    
    if (!replyText.trim()) return

    setIsSubmitting(true)
    
    try {
      const newComment = await apiService.createComment(postId, {
        original_text: replyText.trim(),
        parent_id: parentId
      })
      onCommentAdded(newComment)
      setReplyText('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Failed to create reply:', error)
      alert('답글 작성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const getBotEmoji = (botName?: string) => {
      const emojiMap: Record<string, string> = {
        '하이프봇3000': '🤖',
        '질투AI': '😤',
        '캡틴과장러': '📊',
        '아첨꾼2.0': '✨',
        '축하봇': '🎉',
        '의심킹': '🤔'
      }
      return emojiMap[botName || ''] || '🤖'
    }

    return (
      <div key={comment.id} className={`${isReply ? 'ml-12' : ''} mb-4`}>
        <div className="flex space-x-3">
          {comment.is_bot ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm">
              {getBotEmoji(comment.bot_name)}
            </div>
          ) : comment.user ? (
            <div 
              className="w-8 h-8 rounded-full bg-cover bg-center flex-shrink-0"
              style={{
                backgroundImage: `url('/avatars.jpg')`,
                backgroundPosition: `${(comment.user.avatar - 1) * 25}% 0`
              }}
            />
          ) : null}
          
          <div className="flex-1">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-sm">
                  {comment.is_bot ? comment.bot_name : comment.user?.nickname}
                </span>
                {comment.is_bot && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                    AI 봇
                  </span>
                )}
              </div>
              <p className="text-gray-800 text-sm">{comment.content}</p>
            </div>
            
            {!comment.is_bot && !isReply && (
              <button
                onClick={() => {
                  setReplyingTo(comment.id)
                  setReplyText('')
                }}
                className="text-xs text-gray-500 hover:text-purple-600 mt-1"
              >
                답글 달기
              </button>
            )}
          </div>
        </div>

        {/* 답글 입력 폼 */}
        {replyingTo === comment.id && (
          <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="ml-11 mt-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답글을 입력하세요..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !replyText.trim()}
                className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                답글
              </button>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="px-3 py-2 text-gray-600 text-sm hover:text-gray-800"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* 답글 표시 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  // 부모 댓글만 필터링 (답글이 아닌 것들)
  const parentComments = comments.filter(comment => !comment.parent_id)

  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
      {/* 댓글 입력 폼 */}
      <form onSubmit={handleSubmitComment} className="mb-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            댓글
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          AI가 당신의 댓글도 과장해드립니다! 🎭
        </p>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-1">
        {parentComments.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            첫 번째 댓글을 작성해보세요!
          </p>
        ) : (
          parentComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  )
}

export default CommentSection