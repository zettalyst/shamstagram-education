import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FeedPage from './pages/FeedPage'
import ProfilePage from './pages/ProfilePage'
import InvitationLandingPage from './pages/InvitationLandingPage'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import Navigation from './components/Navigation'

// Services
import { authService } from './services/auth'

/**
 * 메인 앱 컴포넌트
 * 
 * 인증 상태를 관리하고 라우팅을 처리합니다.
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 초기 인증 상태 확인
    const checkAuth = async () => {
      try {
        const token = authService.getToken()
        if (token) {
          const user = await authService.getCurrentUser()
          if (user) {
            setIsAuthenticated(true)
          }
        }
      } catch (error) {
        authService.logout()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navigation />}
        <Routes>
          {/* 초대 랜딩 페이지 */}
          <Route path="/" element={<InvitationLandingPage />} />
          
          {/* 인증이 필요하지 않은 페이지 */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/feed" /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/feed" /> : <RegisterPage onRegister={() => setIsAuthenticated(true)} />
          } />
          
          {/* 인증이 필요한 페이지 */}
          <Route path="/feed" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <FeedPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ProfilePage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App