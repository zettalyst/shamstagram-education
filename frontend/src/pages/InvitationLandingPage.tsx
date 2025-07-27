import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../services/auth'

/**
 * 초대 랜딩 페이지
 * 
 * 초대 토큰을 확인하고 회원가입 페이지로 안내합니다.
 */
const InvitationLandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string>('')
  
  const invitationToken = searchParams.get('token')

  useEffect(() => {
    // 이미 로그인한 경우 피드로 이동
    if (authService.getToken()) {
      navigate('/feed')
      return
    }

    // 초대 토큰이 있는 경우 확인
    if (invitationToken) {
      verifyInvitation(invitationToken)
    }
  }, [invitationToken, navigate])

  const verifyInvitation = async (token: string) => {
    setIsVerifying(true)
    setError('')

    try {
      await authService.verifyInvitation(token)
      // 유효한 토큰이면 회원가입 페이지로 이동
      navigate(`/register?token=${token}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : '초대 토큰이 유효하지 않습니다.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* 로고 섹션 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl shadow-lg mb-6">
            <span className="text-5xl">🤖</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Shamstagram
          </h1>
          <p className="text-lg text-gray-600">
            AI가 만드는 과장된 SNS 세계
          </p>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {isVerifying ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">초대 토큰을 확인하고 있습니다...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-5xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                초대 토큰 오류
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-purple-600 text-white rounded-lg py-3 px-4 hover:bg-purple-700 transition-colors"
              >
                로그인 페이지로 이동
              </button>
            </div>
          ) : !invitationToken ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                환영합니다! 🎉
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Shamstagram은 초대받은 분만 가입할 수 있는
                <br />
                프라이빗 SNS입니다.
              </p>
              
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">
                    🎭 과장의 예술
                  </h3>
                  <p className="text-sm text-purple-700">
                    평범한 일상이 AI의 손길로 화려한 스토리로 변신합니다.
                  </p>
                </div>
                
                <div className="bg-pink-50 rounded-lg p-4">
                  <h3 className="font-semibold text-pink-800 mb-2">
                    🤖 AI 봇 친구들
                  </h3>
                  <p className="text-sm text-pink-700">
                    5명의 개성 넘치는 AI 봇이 당신의 게시물에 반응합니다.
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    🎪 거짓말 파티
                  </h3>
                  <p className="text-sm text-blue-700">
                    모두가 즐기는 유쾌한 과장의 향연에 참여하세요.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-center text-gray-600 mb-4">
                  이미 계정이 있으신가요?
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 px-4 hover:bg-gray-200 transition-colors"
                >
                  로그인하기
                </button>
              </div>

              {/* 데모 모드 안내 */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  데모 체험을 원하시면 초대 토큰 
                  <code className="bg-gray-100 px-1 py-0.5 rounded mx-1">shamwow</code>
                  를 사용하세요
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* 하단 정보 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2024 Shamstagram. 모든 과장은 AI가 책임집니다.</p>
        </div>
      </div>
    </div>
  )
}

export default InvitationLandingPage