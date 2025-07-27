import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { authService } from '../services/auth'

/**
 * 네비게이션 바 컴포넌트
 * 
 * 로그인한 사용자에게 보여지는 상단 네비게이션입니다.
 */
const Navigation: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(authService.getUser())

  useEffect(() => {
    // 사용자 정보 업데이트
    const fetchUser = async () => {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
    }
    fetchUser()
  }, [location])

  const handleLogout = () => {
    authService.logout()
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link to="/feed" className="flex items-center space-x-2">
            <span className="text-2xl">🤖</span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Shamstagram
            </span>
          </Link>

          {/* 네비게이션 메뉴 */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/feed"
              className={`flex items-center space-x-1 transition-colors ${
                isActive('/feed')
                  ? 'text-purple-600 font-medium'
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              <span className="text-xl">🏠</span>
              <span>피드</span>
            </Link>
            <Link
              to="/profile"
              className={`flex items-center space-x-1 transition-colors ${
                isActive('/profile')
                  ? 'text-purple-600 font-medium'
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              <span className="text-xl">👤</span>
              <span>프로필</span>
            </Link>
          </nav>

          {/* 사용자 정보 */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <div 
                  className="w-8 h-8 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url('/avatars.jpg')`,
                    backgroundPosition: `${(user.avatar - 1) * 25}% 0`
                  }}
                />
                <span className="font-medium">{user.nickname}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 모바일 네비게이션 */}
        <nav className="md:hidden flex justify-around py-3 border-t">
          <Link
            to="/feed"
            className={`flex flex-col items-center space-y-1 ${
              isActive('/feed') ? 'text-purple-600' : 'text-gray-600'
            }`}
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs">피드</span>
          </Link>
          <Link
            to="/profile"
            className={`flex flex-col items-center space-y-1 ${
              isActive('/profile') ? 'text-purple-600' : 'text-gray-600'
            }`}
          >
            <span className="text-2xl">👤</span>
            <span className="text-xs">프로필</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Navigation