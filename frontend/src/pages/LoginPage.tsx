import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'

interface LoginPageProps {
  onLogin: () => void
}

/**
 * 로그인 페이지
 * 
 * 사용자 인증을 처리합니다.
 */
const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // 입력 시 에러 메시지 제거
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authService.login(formData)
      onLogin()
      navigate('/feed')
    } catch (error) {
      setError(error instanceof Error ? error.message : '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 로고 섹션 */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
              <span className="text-4xl">🤖</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Shamstagram
            </h1>
          </Link>
          <p className="text-gray-600 mt-2">다시 만나서 반가워요!</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            로그인
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
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
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              아직 계정이 없으신가요?{' '}
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium">
                회원가입
              </Link>
            </p>
          </div>

          {/* 데모 계정 안내 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              데모 계정으로 체험하기
              <br />
              이메일: demo@shamstagram.com
              <br />
              비밀번호: demo1234
            </p>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-800">
            ← 처음 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage