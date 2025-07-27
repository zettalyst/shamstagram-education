import { useState, useEffect } from 'react'
import { apiService, Invitation } from '../services/api'

interface InvitationModalProps {
  onClose: () => void
  onInvitationCreated: () => void
}

/**
 * 초대 관리 모달
 * 
 * 새 초대를 생성하고 기존 초대 목록을 관리합니다.
 */
const InvitationModal: React.FC<InvitationModalProps> = ({ onClose, onInvitationCreated }) => {
  const [email, setEmail] = useState('')
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      const data = await apiService.getInvitations()
      setInvitations(data)
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }

    // 간단한 이메일 형식 검증
    if (!email.includes('@') || !email.includes('.')) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const result = await apiService.createInvitation(email.trim().toLowerCase())
      setInvitations([result.invitation, ...invitations])
      setEmail('')
      setSuccessMessage('초대장이 생성되었습니다!')
      onInvitationCreated()
      
      // 초대 URL 자동 복사
      await copyToClipboard(result.invitation_url)
      setCopiedToken(result.invitation.token)
    } catch (error) {
      setError(error instanceof Error ? error.message : '초대 생성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyUrl = async (invitation: Invitation) => {
    const url = `${window.location.origin}/?token=${invitation.token}`
    await copyToClipboard(url)
    setCopiedToken(invitation.token)
    
    // 3초 후 복사 표시 제거
    setTimeout(() => {
      setCopiedToken(null)
    }, 3000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">친구 초대하기</h2>
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

        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* 초대 생성 폼 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  초대할 이메일 주소
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="friend@email.com"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !email.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    초대하기
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                  {successMessage} 초대 URL이 클립보드에 복사되었습니다.
                </div>
              )}
            </form>
          </div>

          {/* 초대 목록 */}
          <div className="px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">초대 목록</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                아직 생성된 초대가 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {invitations.map(invitation => (
                  <div
                    key={invitation.id}
                    className={`p-4 rounded-lg border ${
                      invitation.is_used
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-purple-50 border-purple-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{invitation.email}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          생성일: {formatDate(invitation.created_at)}
                        </p>
                        {invitation.is_used && invitation.used_at && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ 사용됨: {formatDate(invitation.used_at)}
                          </p>
                        )}
                      </div>
                      
                      {!invitation.is_used && (
                        <button
                          onClick={() => handleCopyUrl(invitation)}
                          className="px-4 py-2 text-sm bg-white border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {copiedToken === invitation.token ? '복사됨!' : 'URL 복사'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            💡 초대받은 친구는 이메일로 회원가입할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  )
}

export default InvitationModal