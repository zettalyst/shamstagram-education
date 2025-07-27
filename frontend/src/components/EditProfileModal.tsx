import { useState } from 'react'
import { User } from '../services/auth'

interface EditProfileModalProps {
  user: User
  onClose: () => void
  onSubmit: (data: { nickname?: string; avatar?: number }) => Promise<void>
}

/**
 * 프로필 편집 모달
 * 
 * 닉네임과 아바타를 변경할 수 있습니다.
 */
const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSubmit }) => {
  const [nickname, setNickname] = useState(user.nickname)
  const [avatar, setAvatar] = useState(user.avatar)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 변경사항이 없으면 그냥 닫기
    if (nickname === user.nickname && avatar === user.avatar) {
      onClose()
      return
    }

    // 닉네임 유효성 검사
    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      setError('닉네임은 2-20자 사이여야 합니다.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const updateData: { nickname?: string; avatar?: number } = {}
      
      if (nickname !== user.nickname) {
        updateData.nickname = nickname.trim()
      }
      
      if (avatar !== user.avatar) {
        updateData.avatar = avatar
      }

      await onSubmit(updateData)
    } catch (error) {
      setError(error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">프로필 편집</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            {/* 닉네임 입력 */}
            <div className="mb-6">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setError('')
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="멋진 닉네임"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                2-20자 사이로 입력해주세요
              </p>
            </div>

            {/* 아바타 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                아바타 선택
              </label>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map(avatarId => (
                  <button
                    key={avatarId}
                    type="button"
                    onClick={() => setAvatar(avatarId)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      avatar === avatarId
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url('/avatars.jpg')`,
                        backgroundPosition: `${(avatarId - 1) * 25}% 0`
                      }}
                    />
                    {avatar === avatarId && (
                      <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                        <span className="text-white text-2xl">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 현재 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="mb-1">
                <span className="font-medium">이메일:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">가입일:</span> {new Date(user.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mt-4">
                {error}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>저장 중...</span>
                </>
              ) : (
                <span>저장하기</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfileModal