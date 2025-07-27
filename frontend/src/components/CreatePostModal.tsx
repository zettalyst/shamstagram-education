import { useState } from 'react'

interface CreatePostModalProps {
  onClose: () => void
  onSubmit: (originalText: string) => Promise<void>
}

/**
 * 게시물 작성 모달
 * 
 * 새 게시물을 작성하는 모달 컴포넌트입니다.
 */
const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSubmit }) => {
  const [originalText, setOriginalText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!originalText.trim()) {
      setError('내용을 입력해주세요.')
      return
    }

    if (originalText.length > 500) {
      setError('내용은 500자 이내로 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onSubmit(originalText.trim())
    } catch (error) {
      setError(error instanceof Error ? error.message : '게시물 작성에 실패했습니다.')
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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">새 게시물 작성</h2>
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
            <div className="mb-4">
              <label htmlFor="originalText" className="block text-sm font-medium text-gray-700 mb-2">
                평범한 일상을 입력하세요
              </label>
              <textarea
                id="originalText"
                value={originalText}
                onChange={(e) => {
                  setOriginalText(e.target.value)
                  setError('')
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="오늘 커피를 마셨다..."
                disabled={isSubmitting}
              />
              <div className="flex justify-between mt-2">
                <p className="text-xs text-gray-500">
                  AI가 당신의 이야기를 화려하게 과장해드립니다! ✨
                </p>
                <p className={`text-xs ${originalText.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                  {originalText.length}/500
                </p>
              </div>
            </div>

            {/* 예시 */}
            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-purple-800 mb-2">💡 예시</h3>
              <div className="space-y-2 text-sm text-purple-700">
                <p>• "오늘 회사에 갔다" → "글로벌 기업의 핵심 인재로서 오늘도 세계 경제를 움직였다"</p>
                <p>• "라면을 끓였다" → "미슐랭 3스타 셰프도 감탄할 황금비율의 라면을 창조했다"</p>
                <p>• "산책을 했다" → "도시 전체를 정복하는 위대한 여정을 완수했다"</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
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
              disabled={isSubmitting || !originalText.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>AI가 과장하는 중...</span>
                </>
              ) : (
                <span>게시하기</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePostModal