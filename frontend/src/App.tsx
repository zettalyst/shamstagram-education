import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import { Button } from './components/ui/button'
import { LogOut, User } from 'lucide-react'

/**
 * 네비게이션 컴포넌트
 * 
 * 인증 상태에 따라 다른 메뉴를 표시합니다.
 */
function Navigation() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const handleLogout = () => {
    logout()
    navigate('/')
  }
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary">
            Shamstagram
          </Link>
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                {/* 로그인한 사용자 메뉴 */}
                <Link to="/feed" className="text-gray-700 hover:text-primary">
                  피드
                </Link>
                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.nickname}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>로그아웃</span>
                </Button>
              </>
            ) : (
              <>
                {/* 비로그인 사용자 메뉴 */}
                <Link to="/about" className="text-gray-700 hover:text-primary">
                  소개
                </Link>
                <Link to="/login" className="text-gray-700 hover:text-primary">
                  로그인
                </Link>
                <Link to="/register">
                  <Button size="sm">회원가입</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

/**
 * 임시 피드 페이지
 */
function TempFeed() {
  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold mb-4">피드 페이지</h1>
      <p className="text-gray-600">곧 멋진 과장된 게시물들이 표시될 예정입니다!</p>
    </div>
  )
}

/**
 * 메인 앱 컴포넌트
 * 
 * React Router와 인증 컨텍스트를 사용하여 앱을 구성합니다.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          
          {/* 라우트 */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {/* 공개 라우트 */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* 보호된 라우트 */}
              <Route
                path="/feed"
                element={
                  <ProtectedRoute>
                    <TempFeed />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App