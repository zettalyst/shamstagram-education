import { useState, useEffect } from 'react'
import { apiService, Post } from '../services/api'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'

/**
 * 피드 페이지
 * 
 * 모든 게시물을 보여주고 새 게시물을 작성할 수 있습니다.
 */
const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const data = await apiService.getPosts()
      setPosts(data)
    } catch (error) {
      setError('게시물을 불러오는데 실패했습니다.')
      console.error('Failed to fetch posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePost = async (originalText: string) => {
    try {
      const newPost = await apiService.createPost({ original_text: originalText })
      setPosts([newPost, ...posts])
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Failed to create post:', error)
      throw error
    }
  }

  const handleLikeToggle = async (postId: number) => {
    try {
      const result = await apiService.toggleLike(postId)
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: result.like_count, is_liked: result.is_liked }
          : post
      ))
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
      return
    }

    try {
      await apiService.deletePost(postId)
      setPosts(posts.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('게시물 삭제에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">게시물을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              AI가 만드는 과장된 이야기들 🎭
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg py-3 px-4 font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2"
            >
              <span className="text-xl">✨</span>
              <span>새 게시물 작성하기</span>
            </button>
          </div>
        </div>

        {/* 게시물 목록 */}
        <div className="max-w-2xl mx-auto space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                아직 게시물이 없습니다
              </h2>
              <p className="text-gray-600 mb-6">
                첫 번째 과장된 이야기를 만들어보세요!
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                게시물 작성하기
              </button>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLikeToggle={handleLikeToggle}
                onDelete={handleDeletePost}
              />
            ))
          )}
        </div>
      </div>

      {/* 게시물 작성 모달 */}
      {isCreateModalOpen && (
        <CreatePostModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  )
}

export default FeedPage