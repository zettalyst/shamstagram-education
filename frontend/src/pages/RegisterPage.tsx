import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../services/auth'

interface RegisterPageProps {
  onRegister: () => void
}

/**
 * 회원가입 페이지
 * 
 * 초대 토큰을 통한 회원가입을 처리합니다.
 */
const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invitationToken = searchParams.get('token') || ''

  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    password: '',
    passwordConfirm: '',
    avatar: 1
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 초대 토큰이 없으면 메인 페이지로
    if (!invitationToken && invitationToken !== 'shamwow') {
      navigate('/')
    }
  }, [invitationToken, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleAvatarSelect = (avatarId: number) => {
    setFormData(prev => ({
      ...prev,
      avatar: avatarId
    }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.nickname || !formData.password || !formData.passwordConfirm) {
      setError('모든 필드를 입력해주세요.')
      return false
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return false
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return false
    }

    if (formData.nickname.length < 2 || formData.nickname.length > 20) {
      setError('닉네임은 2-20자 사이여야 합니다.')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authService.register({
        email: formData.email,
        nickname: formData.nickname,
        password: formData.password,
        avatar: formData.avatar,
        invitation_token: invitationToken
      })
      onRegister()
      navigate('/feed')
    } catch (error) {
      setError(error instanceof Error ? error.message : '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* 로고 섹션 */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-3">
              <span className="text-3xl">🤖</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Shamstagram
            </h1>
          </Link>
          <p className="text-gray-600 mt-2">AI와 함께하는 과장된 SNS에 오신 것을 환영합니다!</p>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            회원가입
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="멋진 닉네임"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="6자 이상"
                required
              />
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                id="passwordConfirm"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="비밀번호 재입력"
                required
              />
            </div>

            {/* 아바타 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아바타 선택
              </label>
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map(avatarId => (
                  <button
                    key={avatarId}
                    type="button"
                    onClick={() => handleAvatarSelect(avatarId)}
                    className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      formData.avatar === avatarId
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url('/avatars.jpg')`,
                        backgroundPosition: `${(avatarId - 1) * 25}% 0`
                      }}
                    />
                    {formData.avatar === avatarId && (
                      <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                        <span className="text-white text-2xl">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg py-3 px-4 font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  가입하는 중...
                </span>
              ) : (
                '가입하기'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-800">
            ← 처음 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage