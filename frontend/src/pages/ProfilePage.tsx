import { useState, useEffect } from 'react'
import { authService, User } from '../services/auth'
import { apiService, Post, Stats } from '../services/api'
import PostCard from '../components/PostCard'
import EditProfileModal from '../components/EditProfileModal'
import InvitationModal from '../components/InvitationModal'

/**
 * 프로필 페이지
 * 
 * 사용자 정보, 통계, 초대 관리를 담당합니다.
 */
const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getUser())
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // 사용자 정보 새로고침
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }

      // 내 게시물 가져오기
      const posts = await apiService.getMyPosts()
      setMyPosts(posts)

      // 통계 가져오기
      const statsData = await apiService.getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch profile data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async (data: { nickname?: string; avatar?: number }) => {
    try {
      await apiService.updateProfile(data)
      const updatedUser = await authService.getCurrentUser()
      if (updatedUser) {
        setUser(updatedUser)
      }
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  const handleLikeToggle = async (postId: number) => {
    try {
      const result = await apiService.toggleLike(postId)
      setMyPosts(myPosts.map(post => 
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
      setMyPosts(myPosts.filter(post => post.id !== postId))
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
          <p className="mt-4 text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* 프로필 헤더 */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">내 프로필</h1>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                프로필 편집
              </button>
            </div>

            {user && (
              <div className="flex items-center space-x-6">
                <div 
                  className="w-24 h-24 rounded-full bg-cover bg-center border-4 border-purple-100"
                  style={{
                    backgroundImage: `url('/avatars.jpg')`,
                    backgroundPosition: `${(user.avatar - 1) * 25}% 0`
                  }}
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{user.nickname}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 통계 섹션 */}
          {stats && (
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Shamstagram 통계</h2>
              
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.total_users}</div>
                  <div className="text-sm text-gray-600 mt-1">전체 사용자</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">{stats.total_posts}</div>
                  <div className="text-sm text-gray-600 mt-1">전체 게시물</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.total_comments}</div>
                  <div className="text-sm text-gray-600 mt-1">전체 댓글</div>
                </div>
              </div>

              {stats.top_users.length > 0 && (
                <>
                  <h3 className="font-semibold text-gray-800 mb-4">🏆 활발한 사용자들</h3>
                  <div className="space-y-3">
                    {stats.top_users.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          <div 
                            className="w-10 h-10 rounded-full bg-cover bg-center"
                            style={{
                              backgroundImage: `url('/avatars.jpg')`,
                              backgroundPosition: `${(user.avatar - 1) * 25}% 0`
                            }}
                          />
                          <span className="font-medium text-gray-800">{user.nickname}</span>
                        </div>
                        <span className="text-sm text-gray-600">{user.post_count} 게시물</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setIsInvitationModalOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg py-3 px-4 font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  친구 초대하기 💌
                </button>
              </div>
            </div>
          )}

          {/* 내 게시물 섹션 */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">내 게시물 ({myPosts.length})</h2>
            
            {myPosts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600">아직 작성한 게시물이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {myPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLikeToggle={handleLikeToggle}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 프로필 편집 모달 */}
      {isEditModalOpen && user && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleProfileUpdate}
        />
      )}

      {/* 초대 모달 */}
      {isInvitationModalOpen && (
        <InvitationModal
          onClose={() => setIsInvitationModalOpen(false)}
          onInvitationCreated={fetchData}
        />
      )}
    </div>
  )
}

export default ProfilePage